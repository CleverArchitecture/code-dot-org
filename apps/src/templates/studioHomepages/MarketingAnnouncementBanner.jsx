import PropTypes from 'prop-types';
import React, {useState, useEffect, useRef} from 'react';
import {TwoColumnActionBlock} from './TwoColumnActionBlock';
import {tryGetLocalStorage, trySetLocalStorage} from '@cdo/apps/utils';
import Button from '@cdo/apps/templates/Button';
import color from '../../util/color';
import shapes from './shapes';
import firehoseClient from '@cdo/apps/lib/util/firehose';
import {pegasus} from '@cdo/apps/lib/util/urlHelpers';

// MarketingAnnouncementBanner is a wrapper around SpecialAnnouncementActionBlock which adds
// a button to dismiss the banner. It also listens for modifications to the banner through
// optimizely and checks if the new version of the banner has been dismissed.
const MarketingAnnouncementBanner = ({
  announcement,
  marginBottom,
  marketingSegmentData
}) => {
  const [displayBanner, setDisplayBanner] = useState(true);
  const bannerRef = useRef(null);

  const overrideAnnouncement = getTargetedBanner(marketingSegmentData);
  let displayedBanner = overrideAnnouncement || announcement;

  useEffect(() => {
    if (window['optimizely']) {
      const optimizelyUtils = window['optimizely'].get('utils');
      // When modifications are made to the banner through optimizely, check whether
      // this version of the banner has been dismissed by the teacher
      optimizelyUtils.observeSelector(
        `#${bannerRef.current.id}`,
        checkShouldDisplayBanner
      );
    }
    checkShouldDisplayBanner();
  }, []);

  const checkShouldDisplayBanner = () => {
    const bannerKey = getLocalStorageBannerKey();
    const displayBanner = tryGetLocalStorage(bannerKey, true);
    if (displayBanner === 'false') {
      setDisplayBanner(false);
    }
  };

  const getLocalStorageBannerKey = () => {
    let bannerId = displayedBanner.id;

    const optimizelyId = getOptimizelyModifiedElementId();
    if (optimizelyId) {
      bannerId = optimizelyId;
    }

    return `display-announcement-${bannerId}`;
  };

  const getOptimizelyModifiedElementId = () => {
    const allBannerElements = bannerRef.current.querySelectorAll('*');

    const getOptlyDataAttrKey = element => {
      return Object.keys(element.dataset).find(key => key.includes('optly'));
    };

    // Finds an element that was modified by optimizely if one exists
    const optlyModifiedElement = [...allBannerElements].find(el =>
      getOptlyDataAttrKey(el)
    );

    if (optlyModifiedElement) {
      // Returns the optimizely data attribute key for the changed element
      // will be something like optly-0ef57bf5F12b-4290A4dbA1de95a9b5cd
      return getOptlyDataAttrKey(optlyModifiedElement);
    }
  };

  const onDismiss = () => {
    const bannerKey = getLocalStorageBannerKey();
    trySetLocalStorage(bannerKey, false);
    setDisplayBanner(false);
    logEvent('close_button_clicked');
  };

  const logEvent = eventLabel => {
    firehoseClient.putRecord(
      {
        study: 'teacher_signedin_homepage',
        study_group: 'homepage_banner',
        event: eventLabel,
        data_json: JSON.stringify({
          banner_title: bannerRef.current.querySelector(
            '#two-column-action-block--sub-heading'
          ).innerText
        })
      },
      {includeUserId: true}
    );
  };

  // This banner is hidden through css because it still needs to be accessible
  // in the DOM so that it can be manipulated by Optimizely by marketing.
  // Once it has been modified through optimizely, checkShouldDisplayBanner is called
  // and the value of displayBanner may change.
  const bannerDisplayStyle = displayBanner ? 'block' : 'none';

  const button = {
    id: displayedBanner.buttonId
      ? displayedBanner.buttonId
      : 'marketing-announcement-banner-btn',
    url: displayedBanner.buttonUrl,
    text: displayedBanner.buttonText,
    onClick: () => logEvent('cta_button_clicked')
  };

  return (
    <div
      id="marketing-announcement-banner"
      style={{
        ...styles.container,
        display: bannerDisplayStyle
      }}
    >
      {/* ID is used for easier targeting in Optimizely */}
      <div id="special-announcement-action-block" ref={bannerRef}>
        <TwoColumnActionBlock
          imageUrl={pegasus(displayedBanner.image)}
          subHeading={displayedBanner.title}
          description={displayedBanner.body}
          buttons={[button]}
          backgroundColor={displayedBanner.backgroundColor}
          marginBottom={marginBottom}
        />
      </div>
      <Button
        id="marketing-announcement-banner--dismiss"
        text="×"
        onClick={onDismiss}
        style={styles.dismissButtonStyle}
        styleAsText={true}
      />
    </div>
  );
};

const getTargetedBanner = marketingSegmentData => {
  // target California and Washington teachers who have not attended PD
  if (
    marketingSegmentData['has_attended_pd'] === false &&
    (marketingSegmentData['school_state'] === 'CA' ||
      marketingSegmentData['school_state'] === 'WA')
  ) {
    return {
      id: 'ca-wa-superhero-custom',
      image: '/images/marketing/superhero_teacherdash.png',
      title: 'CA & WA teachers - Help your students become superheroes!',
      body: 'Something custom for these states!!',
      buttonText: 'Learn More',
      buttonUrl: 'https://code.org/educate/professional-learning/',
      buttonId: 'superhero-pl-details'
    };
  }
};

const styles = {
  container: {
    position: 'relative'
  },
  dismissButtonStyle: {
    position: 'absolute',
    top: '6px',
    right: '10px',
    color: color.white,
    fontSize: '22px',
    fontWeight: 'bold'
  }
};

MarketingAnnouncementBanner.propTypes = {
  announcement: shapes.specialAnnouncement,
  marginBottom: PropTypes.string,
  marketingSegmentData: PropTypes.object
};

export default MarketingAnnouncementBanner;
