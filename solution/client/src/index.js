/* global document */

/**
 * index.js
 * 
 * Root of the SPA.
 * Declares and initialises React Virtual DOM.
 * 
 * @author Petar Barzev
 * 
 * Last updated: 22/05/2017
 */

import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import './index.css';

if (typeof document !== 'undefined') {
  ReactDOM.render(
    <App />,
    document.getElementById('root')
  );
}
