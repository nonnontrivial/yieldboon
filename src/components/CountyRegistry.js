import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import lowerCase from 'lodash/lowerCase';
import { connect } from 'react-redux';
import Table, {
  TableRow,
  TableBody,
  TableCell,
  TableHead,
} from 'material-ui/Table';
import Checkbox from 'material-ui/Checkbox';
import { MuiThemeProvider, createMuiTheme } from 'material-ui/styles';

import * as selectors from '../selectors';
import { setForecastFilter } from '../actions';

class CountyRegistry extends PureComponent {
  static propTypes = {
    selectedState: PropTypes.string.isRequired,
    // Provided via connect:
    isFetching: PropTypes.bool,
    disallowedIds: PropTypes.arrayOf(PropTypes.string),
    activeCounties: PropTypes.arrayOf(PropTypes.object).isRequired
  };

  constructor(props) {
    super(props);
    this.state = {
      didCheckAll: true
    }
  }

  onChange = (id, isChecked) => {
    this.props.setForecastFilter({
      [`${isChecked ? 'revealed' : 'hidden' }Ids`]: [id]
    })
  };

  onSelectAll = (event, isChecked) => {
    const { setForecastFilter, activeCounties } = this.props;
    this.setState({ didCheckAll: isChecked });
    setForecastFilter({
      [`${isChecked ? 'revealed' : 'hidden' }Ids`]: activeCounties.map(({ id }) => id)
    })
  };

  theme = createMuiTheme({
    overrides: {
      MuiTableHead: {
        root: {
          color: '#1c243d',
        }
      },
      MuiTableRow: {
        root: {
          fontFamily: 'Noto Sans',
          fontSize: '0.8em',
          color: '#151b2d'
        }
      },
      MuiCheckbox: {
        checked: {
          color: '#7795f8'
        },
        default: {
          color: '#7795f8'
        }
      }
    }
  });

  render() {
    const { isFetching, activeCounties, disallowedIds = [] } = this.props;
    const { didCheckAll } = this.state;
    return (
      <div style={{
        margin: '10px',
        minHeight: '100px',
        maxHeight: '220px',
        overflow: 'auto',
        padding: '10px',
        position: 'relative',
        boxShadow: '0 1px 3px 0 rgba(7, 9, 15, 0.3), 0 1px 1px 0 rgba(7, 9, 15, 0.14), 0 2px 1px -1px rgba(7, 9, 15, 0.2)'
      }}>
        {isFetching
          ? null
          : <MuiThemeProvider theme={this.theme}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell checkbox>
                      <Checkbox
                        checked={didCheckAll}
                        onChange={this.onSelectAll} />
                    </TableCell>
                    {!activeCounties.length
                      ? null
                      : Object.keys(activeCounties[0]).slice(1).map((key, i) => (
                          <TableCell key={i}>
                            {lowerCase(key)}
                          </TableCell>
                        ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {activeCounties.map(({ id, countyName, soybeanYield, totalRainfall }) => (
                    <TableRow
                      key={id}
                      selected={false}>
                      <TableCell checkbox>
                        <Checkbox
                          checked={!disallowedIds.includes(id)}
                          onChange={(event, isChecked) => this.onChange(id, isChecked)} />
                      </TableCell>
                      <TableCell>
                        {countyName}
                      </TableCell>
                      <TableCell>
                        {soybeanYield}
                      </TableCell>
                      <TableCell>
                        {totalRainfall}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </MuiThemeProvider>}
      </div>
    )
  }
}

function mapStateToProps(state) {
  return {
    isFetching: selectors.getIsFetching(state),
    disallowedIds: selectors.getDisallowedIds(state),
    activeCounties: selectors.getActiveCounties(state)
  }
}

export default connect(mapStateToProps, { setForecastFilter })(CountyRegistry);
