'use strict';

import React from 'react';
import { render } from 'react-dom';
import AtomSpinner from './app/AtomSpinner.jsx';

function App() {
  return (
    <AtomSpinner
    color='#000000'
	size='200'
	
    />
  )
}

render(
  <App />,
  document.getElementById('root')
);
