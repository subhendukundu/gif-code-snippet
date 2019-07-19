import React, { useState, useRef, useCallback, createRef, useEffect } from 'react';
import MonacoEditor from '@monaco-editor/react';
import Dropdown from '../Dropdown/Dropdown.js';


const MAX_HEIGHT = 600;
const MIN_COUNT_OF_LINES = 9;

function Editor() {
  const [theme, setTheme] = useState('dark');
  const [height, setHeight] = useState(198);
  const [language, setLanguage] = useState('javascript');
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [code, setCode] = useState('');
  const [imageSrc, setImageSrc] = useState('');
  const [ loading, setLoading ] = useState(false);
  const [ notFirstSelected, makeFirstSelected ] = useState(false);
  const valueGetter = useRef();
  const counts = useRef(0);
  const canvasCollections = useRef([]);
  const totalCount = useRef(0);
  const actualString = useRef('');
  const html2canvas = require("html2canvas");
  const editorRef = createRef();

  const handleEditorChange = useCallback(_ => {
    const countOfLines = valueGetter.current().split("\n").length;
    if (countOfLines >= MIN_COUNT_OF_LINES) {
      const currentHeight = countOfLines * 22;
      if (MAX_HEIGHT > currentHeight) {
        setHeight(currentHeight);
      }
    }
  }, []);

  function handleEditorDidMount(_valueGetter, editorComponent) {
    setIsEditorReady(true);
    valueGetter.current = _valueGetter;
    editorComponent.onDidChangeModelContent(handleEditorChange);
  }

  function renderGifImage() {
    const { current } = canvasCollections;
    if (window.gifshot && current.length) {
      const { clientHeight, clientWidth } = editorRef.current;
      window.gifshot.createGIF({
        'gifWidth': clientWidth,
        'gifHeight': clientHeight,
        'images': canvasCollections.current,
        'frameDuration': 10
      }, (obj) => {
        if(!obj.error) {
          setLoading(false);
          canvasCollections.current = [];
          const { image } = obj;
          counts.current = -1;
          setImageSrc(image);
        }
      });
    }
  }

  useEffect(() => {
    if (counts.current > 0 && counts.current === totalCount.current) {
      renderGifImage();
    }
    if (counts.current > -1 && counts.current < totalCount.current) {
      counts.current = counts.current + 1;
      const stringArr = actualString.current.split(/\n/g);
      const newString = stringArr.splice(0, counts.current).join('\n');
      html2canvas(editorRef.current).then(canvas => {
        canvasCollections.current.push(canvas);
        setCode(newString);
      });
    }
  });


  function handleCreateGif() {
    counts.current = 0;
    const stringToModify = actualString.current = valueGetter.current();
    if (stringToModify.length) {
      setLoading(true);
      const stringArr = stringToModify.split(/\n/g);
      totalCount.current = stringArr.length;
      const newString = stringArr.splice(0, counts.current).join('\n');
      setCode(newString);
    }
  }
  
  function toggleTheme(e) {
    setTheme(theme ==='light' ? 'dark' : 'light');
  }
  
  function toggleLanguage(e) {
    const elem = e.target;
    const value = elem.getAttribute('value');
    document.getElementsByClassName('dropdown-button')[0].innerHTML = value;
    if (!notFirstSelected) {
      makeFirstSelected(true);
      setLanguage(value);
    } else {
      setLanguage(value);
    }
  }

  const Loader = () => (<div className="lds-ellipsis"><div></div><div></div><div></div><div></div></div>);

  return (
    <>
      <div className="logo">
        <img src="/logo.png" alt="Logo for gif snippet" />
      </div>
      <div className="editor-container">
        <div className="action-container">
          <div className="theme-switch">
            <label className="switch">
              <input type="checkbox" onChange={toggleTheme} />
              <span className="slider"></span>
            </label>
            <span className="slider-text">Theme</span>
          </div>
          <div className="button-dropdown-container">
            <Dropdown disabled={notFirstSelected} onChange={toggleLanguage} />
            </div>
            <button
              className="shadow-button"
              onClick={handleCreateGif}
              disabled={!isEditorReady}
            >
              Create GIF
            </button>
        </div>
        <div className="editor-loader-container">
          <div ref={editorRef}>
            <MonacoEditor
              height={height}
              theme={theme}
              language={language}
              value={code}
              editorDidMount={handleEditorDidMount}
              loading={<Loader />}
            />
          </div>
          {loading && <div className="loader-wrapper"><Loader /></div>}
        </div>
        {imageSrc && (
          <div className="output-container">
            <a
              href={imageSrc}
              download="snippet.gif"
              className="shadow-button download-button"
            >Download</a>
            <img src={imageSrc} alt="snippent gif" />
          </div>
        )}
      </div>
    </>
  );
}

export default Editor;