import React, { useState, useRef, createRef, useEffect } from 'react';
import MonacoEditor from '@monaco-editor/react';


function Editor() {
  const [theme, setTheme] = useState('dark');
  const [language, setLanguage] = useState('javascript');
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [code, setCode] = useState('');
  const [imageSrc, setImageSrc] = useState('');
  const [ loading, setLoading ] = useState(false);
  const valueGetter = useRef();
  const counts = useRef(0);
  const canvasCollections = useRef([]);
  const totalCount = useRef(0);
  const actualString = useRef('');
  const html2canvas = require("html2canvas");
  const editorRef = createRef();

  function handleEditorDidMount(_valueGetter) {
    setIsEditorReady(true);
    valueGetter.current = _valueGetter;
  }

  function renderGifImage() {
    if (gifshot) {
      const { clientHeight, clientWidth } = editorRef.current;
      gifshot.createGIF({
        'gifWidth': clientWidth,
        'gifHeight': clientHeight,
        'images': canvasCollections.current,
        'frameDuration': 10
      }, (obj) => {
        if(!obj.error) {
          setLoading(false);
          const { image } = obj;
          counts.current = 0;
          setImageSrc(image);
        }
      });
    }
  }

  useEffect(() => {
    if (counts.current > 0 && counts.current === totalCount.current) {
      renderGifImage();
    }
    if (counts.current > 0 && counts.current < totalCount.current) {
      counts.current = counts.current + 1;
      const stringArr = actualString.current.split(/\n/g);
      const newString = stringArr.splice(0, counts.current).join('\n');
      html2canvas(editorRef.current).then(canvas => {
        canvasCollections.current.push(canvas);
        setCode(newString);
      });
    }
  });

  function handleShowValue() {
    setLoading(true);
    counts.current = 1;
    const stringToModify = actualString.current = valueGetter.current();
    const stringArr = stringToModify.split(/\n/g);
    totalCount.current = stringArr.length;
    const newString = stringArr.splice(0, counts.current).join('\n');
    setCode(newString);
  }
  
  function toggleTheme(e) {
    setTheme(theme ==='light' ? 'dark' : 'light');
  }
  
  function toggleLanguage(e) {
    setLanguage(e);
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
            <select className="shadow-select">
              <option>Choose language</option>
              <option value="javascript">Javascript</option>
              <option value="python">Python</option>
            </select>
            <button
              className="shadow-button"
              onClick={handleShowValue}
              disabled={!isEditorReady}
            >
              Create GIF
            </button>
          </div>
        </div>
        <div className="editor-loader-container">
          <div ref={editorRef}>
            <MonacoEditor
              height={'50vh'}
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
          <div>
            <a
              href={imageSrc}
              download="snippet.gif"
              className="shadow-button download-button"
            >Download</a>
            <img src={imageSrc} />
          </div>
        )}
      </div>
    </>
  );
}

export default Editor;