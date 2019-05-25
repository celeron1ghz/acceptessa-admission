import React from 'react';
import ReactDOM from 'react-dom';
import * as serviceWorker from './serviceWorker';

import Root         from './route/Root';
import Scanner      from './route/Scanner';
import SampleBook   from './route/SampleBook';
import Statistic    from './route/Statistic';

import "@fortawesome/fontawesome-free/css/all.min.css";
import "bootstrap-css-only/css/bootstrap.min.css";
import "mdbreact/dist/css/mdb.css";

const { BrowserRouter, Route } = require('react-router-dom');

const Router = () => (
  <BrowserRouter>
    <div>
      <Route exact path='/'     component={Root} />
      <Route path='/scan'       component={Scanner} />
      <Route path='/register'   component={SampleBook} />
      <Route path='/statistic'  component={Statistic} />
    </div>
  </BrowserRouter>
);

ReactDOM.render(<Router/>, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
