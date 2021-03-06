import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Route, Redirect } from 'react-router-dom';

import './app.css';
import 'react-vis/dist/style.css';

import Dashboard from './Dashboard';
import * as selectors from './selectors';

class App extends Component {
  static propTypes = {
    selectedState: PropTypes.string
  };

  render() {
    const { selectedState } = this.props;
    return (
      <div>
        <Route
          path="/"
          render={_ => <Redirect to={`/dashboard/${selectedState}`} />} />
        <Route
          exact
          path="/dashboard/:selectedState"
          component={Dashboard} />
      </div>
    )
  }
}

function mapStateToProps(state) {
  return {
    selectedState: selectors.getSelectedState(state)
  }
}

export default connect(mapStateToProps)(App);
