import React from 'react';
import Button from '@cdo/apps/templates/Button';
import color from '@cdo/apps/util/color';

export default class SpriteManagementDirectory extends React.Component {
  render() {
    return (
      <div>
        <h1>Manage Sprite Lab Sprites</h1>
        <h3>
          <a href="/sprites/sprite_upload">Upload New Sprites</a>
        </h3>
        <h3>
          <a href="/sprites/default_sprites_editor">Edit Default Sprites</a>
        </h3>
        <div style={styles.pageBreak}>
          <Button
            text="Move Levelbuilder Change to Production"
            color={Button.ButtonColor.red}
            onClick={() => console.log('Move to production')}
            style={styles.button}
          />
        </div>
      </div>
    );
  }
}

const styles = {
  pageBreak: {
    borderTop: `1px solid ${color.dark_slate_gray}`
  },
  button: {
    margin: 20
  }
};
