import PropTypes from 'prop-types';
import React from 'react';
import * as storybook from '@storybook/react';
import {setOptions} from '@storybook/addon-options';
import experiments from '@cdo/apps/util/experiments';
import withReduxStore from '../test/util/withReduxStore';

import '../style/common.scss';
import '../style/netsim/style.scss';
import '../style/applab/style.scss';
import '../style/code-studio/petition.scss';
import '../src/templates/GameButtons.story.scss';

const styles = {
  centeredStory: {
    position: 'absolute',
    left: 0,
    right: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  storyTable: {
    table: {backgroundColor: 'white', tableLayout: 'fixed', width: '100%'},
    row: {border: '1px solid #ccc'},
    cell: {width: '50%', padding: 20}
  },
  deprecatedStory: {
    width: '100%',
    height: '100vh',
    paddingLeft: 50,
    paddingRight: 50
  },
  deprecatedStoryHeader: {
    color: 'red',
    textAlign: 'center'
  },
  deprecatedImg: {
    float: 'right'
  }
};

const storybookWrapper = Object.create(storybook);
storybookWrapper.deprecatedStoriesOf = (name, module, options) => {
  const defaultDeprecationReason = `No reason specified. You can pass a third argument
                                    to depcreatedStoriesOf() with a reason`;
  return storybook
    .storiesOf(name + ' (Deprecated)', module)
    .add('DEPRECATED', () => (
      <div style={styles.deprecatedStory}>
        <h1 style={styles.deprecatedStoryHeader}>
          !! THIS COMPONENT HAS BEEN DEPRECATED !!
        </h1>
        <img
          style={styles.deprecatedImg}
          src="https://cdn.meme.am/instances/500x/62160477.jpg"
        />
        <dl>
          <dt>
            <strong>reason:</strong>
          </dt>
          <dd>{(options && options.reason) || defaultDeprecationReason}</dd>
          <dt>
            <strong>replacement:</strong>
          </dt>
          <dd>
            {options && options.replacement && (
              <a href="#" onClick={storybook.linkTo(options.replacement)}>
                {`<${options.replacement}>`}
              </a>
            )}
          </dd>
        </dl>
      </div>
    ));
};

function loadStories() {
  require('./about');
  require('./colors');

  var sidecarContext = require.context('../src/', true, /\.story\.jsx?$/);
  sidecarContext.keys().forEach(key => {
    var module;
    try {
      module = sidecarContext(key);
      module(storybookWrapper);
    } catch (e) {
      console.error('failed to load', key, e);
      console.error(e.stack);
      return;
    }
  });
}

setOptions({
  sortStoriesByKind: true
});

function Centered({children}) {
  return <div style={styles.centeredStory}>{children}</div>;
}
Centered.propTypes = {
  children: PropTypes.node
};

storybook.setAddon({
  withExperiments(...experimentList) {
    this.experiments = experimentList;
  }
});

storybook.setAddon(withReduxStore);

storybook.setAddon({
  addStoryTable(items) {
    this.add('Overview', () => {
      // Make sure that the only experiments enabled are those that we explicitly
      // added via withExperiments
      localStorage.removeItem('experimentsList');
      if (this.experiments) {
        this.experiments.forEach(key => experiments.setEnabled(key, true));
      }
      return (
        <div>
          <table style={styles.storyTable.table}>
            <thead>
              <tr>
                <th>Version</th>
                <th>Rendered</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr style={styles.storyTable.row} key={index}>
                  <td style={styles.storyTable.cell}>
                    <strong>{item.name}</strong>
                    <p>{item.description || ''}</p>
                  </td>
                  <td
                    className={item.storyCellClass}
                    style={styles.storyTable.cell}
                  >
                    {item.story()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    });
    items.forEach(item => this.add(item.name, item.story));
  }
});

storybook.addDecorator(story => {
  var rendered = story();
  return <Centered>{rendered}</Centered>;
});
storybook.configure(loadStories, module);
