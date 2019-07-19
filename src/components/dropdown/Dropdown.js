import React, { useState }  from 'react';
import languageArray from '../../static/languages';
import './styles.css';


function Dropdown(props) {

  const [ displayMenu, setdisplayMenu ] = useState(false);
  
  const onChooseLanguage = (e) => {
    e.preventDefault()
    props.onChange(e);
    setdisplayMenu(false);
  }

  function showDropdownMenu(e) {
      e.preventDefault();
      if (displayMenu) {
        setdisplayMenu(false);
      } else {
        setdisplayMenu(true);
      }
    }

    function modifyLanguageString(str) {
      const tempStr = str.replace(/^./, str => str.toUpperCase()).replace('-', ' ');
      return tempStr;
    }

  const renderLanguages = languageArray.map(item => <li className="dropdown-list-items" key={item} value={item} onClick={onChooseLanguage}><a href="#" value={item} role="button">{item ? modifyLanguageString(item) : '' }</a></li>);

  return (
        <div className="dropdown" >
	        <button className="button dropdown-button" onClick={showDropdownMenu}>
            Languages
          </button>
          { displayMenu ? (
            <ul className="dropdown-list">
              {renderLanguages}
            </ul> ): null
          }
        </div>
  );
}


export default Dropdown;
