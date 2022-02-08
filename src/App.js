import React, {Component} from 'react';
import logo from './logo.svg';
import './App.css';
import * as mmb from 'music-metadata-browser';

class App extends Component {

  // metadata and file data

  constructor(props) {
    super(props);
    this.state = {
      parseResults: [],
      parseResultsMultiple: []
    };
  }

  render() {

    console.log('render called');

    const htmlParseResults = [];

    console.log('parseResultsMultiple=', this.state.parseResultsMultiple)

    for (const parseResult of this.state.parseResults) {

      console.log(`metadata ${parseResult.file.name}`, parseResult);

      const htmlMetadata = parseResult.metadata ? (
        <table>
          <tbody>
          <tr>
            <th>Container</th>
            <td>{parseResult.metadata.format.container}</td>
          </tr>
          <tr>
            <th>Codec</th>
            <td>{parseResult.metadata.format.codec}</td>
          </tr>
          <tr>
            <th>Bit-rate</th>
            <td>{parseResult.metadata.format.bitrate}</td>
          </tr>
          <tr>
            <th>Filename</th>
            <td>{parseResult.metadata.common.title}</td>
          </tr>
          </tbody>
        </table>
      ) : ( parseResult.error ? (<p className="App-error">{parseResult.error}</p>) : (<p>Parsing...</p>));

      htmlParseResults.push(
        <div key={parseResult.file.name}>
          <h3>{parseResult.file.name}</h3>
          {htmlMetadata}
        </div>
      );
    }

    if (this.state.parseResults.length === 0) {
      htmlParseResults.push(<div key="message">Please choose an audio file</div>);
    }

    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo"/>
          <a className="App-link" href="https://github.com/Borewit/music-metadata-browser"
             target="_blank">music-metadata-browser</a> &
          <a className="App-link" href="https://reactjs.org" target="_blank">React</a>
        </header>

        <hr></hr>
        multiple files:
        <input type="file" multiple="multiple" onChange={this.onChangeMultipleHandler}></input>
        <hr></hr>

        <input type="file" name="file" onChange={this.onChangeHandler}/>

        {htmlParseResults}

      </div>
    );
  }

  //when multiple files are selected
  onChangeMultipleHandler = async (event) => {
    this.setState({
      parseResultsMultiple: []
    });


    let startSeconds = 0
    let endSeconds = 0
    let startTime = '';
    let endTime = '';

    var timestampedTracklist = ``;

    for (const file of event.target.files) {
      
      const parseResult = {
        file: file
      };

      this.setState(state => {
        state.parseResultsMultiple.push(parseResult);
        return state;
      });

      //get metadata
      try {
        const metadata = await this.parseFile(file);

        //get duration (seconds)
        var durationSeconds = metadata.format.duration;
        console.log('duration seconds =',durationSeconds)
        //convert duration to hh:mm:ss
        var duration = new Date(durationSeconds * 1000).toISOString().substr(11, 8)
        console.log('duration =',duration)
        
        //set startSeconds
        if(endSeconds === 0){
          startSeconds = 0;
        }else{
          startSeconds = endSeconds;
        }
        //set endSeconds
        endSeconds = startSeconds + durationSeconds
        //convert to readable times
        startTime =  new Date(startSeconds * 1000).toISOString().substr(11, 8)
        endTime =  new Date(endSeconds * 1000).toISOString().substr(11, 8)

        //get track title
        let trackTitle = metadata.common.title;

        timestampedTracklist = `${timestampedTracklist}\n${startTime} - ${endTime} ${trackTitle}`
        //console.log(`${startTime} - ${endTime} ${trackTitle}`)

        // Update GUI
        this.setState(state => {
          state.parseResultsMultiple[state.parseResultsMultiple.length - 1].metadata = metadata;
          return state;
        });
      }catch(err){

      }

    }

    console.log(timestampedTracklist)
  }

  //when file upload handler is changed
  onChangeHandler = async (event) => {

    this.setState({
      parseResults: []
    });

    for (const file of event.target.files) {

      const parseResult = {
        file: file
      };

      this.setState(state => {
        state.parseResults.push(parseResult);
        return state;
      });

      try {
        const metadata = await this.parseFile(file);
        // Update GUI
        this.setState(state => {
          state.parseResults[state.parseResults.length - 1].metadata = metadata;
          return state;
        });

      } catch(err) {
        this.setState(state => {
          state.parseResults[state.parseResults.length - 1].error = err.message;
          return state;
        });
      }
    }
  };

  //get metadata for audio file
  async parseFile(file) {
    console.log(`Parsing file "${file.name}" of type ${file.type}`);

    return mmb.parseBlob(file, {native: true}).then(metadata => {
      console.log(`Completed parsing of ${file.name}:`, metadata);
      return metadata;
    })
  }

}

export default App;
