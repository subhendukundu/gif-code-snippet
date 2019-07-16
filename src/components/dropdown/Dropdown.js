import React from 'react';
import languageArray from '../../static/languages';
import './styles.css';


class Dropdown extends React.Component {
constructor(){
 super();

 this.state = {
       displayMenu: false,
     };

  this.showDropdownMenu = this.showDropdownMenu.bind(this);
  this.hideDropdownMenu = this.hideDropdownMenu.bind(this);

};

showDropdownMenu(event) {
    event.preventDefault();
    this.setState({ displayMenu: true }, () => {
    document.addEventListener('click', this.hideDropdownMenu);
    });
  }

  hideDropdownMenu() {
    this.setState({ displayMenu: false }, () => {
      document.removeEventListener('click', this.hideDropdownMenu);
    });
  }

  modifyLanguageString(str) {
    const tempStr = str.replace(/^./, str => str.toUpperCase()).replace('-', ' ');
    return tempStr;
  }

  render() {
    const renderLanguages = languageArray.map(item => <li key={item} value={item} onClick={this.props.onChange}><a href="javascript:void(0)" value={item} role="button">{item ? this.modifyLanguageString(item) : '' }</a></li>);

    return (
        <div  className="dropdown" >
	        <button className="button dropdown-button" onClick={this.showDropdownMenu}> Languages </button>

          { this.state.displayMenu ? (
          <ul>
            {renderLanguages}
          </ul>
        ):
        (
          null
        )
        }

	      </div>

    );
  }


}


export default Dropdown;
