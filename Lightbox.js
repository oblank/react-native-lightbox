import React, { Component, Children, cloneElement } from 'react';
import PropTypes from 'prop-types';
import { Animated, StatusBar, TouchableHighlight, View, Platform } from 'react-native';

import LightboxOverlay from './LightboxOverlay';
import './Gallery';

const isIOS = Platform.OS === 'ios';

export default class Lightbox extends Component {
  static propTypes = {
    activeProps    : PropTypes.object,
    images         : PropTypes.array,
    renderHeader   : PropTypes.func,
    renderFooter   : PropTypes.func,
    renderContent  : PropTypes.func,
    underlayColor  : PropTypes.string,
    backgroundColor: PropTypes.string,
    didOpen        : PropTypes.func,
    onOpen         : PropTypes.func,
    willClose      : PropTypes.func,
    onClose        : PropTypes.func,
    springConfig   : PropTypes.shape({
      tension : PropTypes.number,
      friction: PropTypes.number,
    }),
    swipeToDismiss : PropTypes.bool,

    renderMask: PropTypes.func,

  };

  static defaultProps = {
    swipeToDismiss: true,
    onOpen        : () => {
    },
    didOpen       : () => {
    },
    willClose     : () => {
    },
    onClose       : () => {
    },
    renderMask    : () => {
    },

  };

  children = null;

  state = {
    isOpen       : false,
    origin       : {
      x     : 0,
      y     : 0,
      width : 0,
      height: 0,
    },
    layoutOpacity: new Animated.Value(1),

  };

  componentWillMount() {
    var children = cloneElement(
      Children.only(this.props.children),
      this.props.activeProps
    );
    this.children = children;
    if (this.props.galleryMode) {
      var GKeyArray = global.gallery.get(this.props.GKey);
      if (!!GKeyArray) {
        GKeyArray.push(children)
      } else {
        GKeyArray = [ children ]
      }
      global.gallery.set(this.props.GKey, GKeyArray);
    }
  }

  componentWillUnmount() {
    global.gallery.delete(this.props.GKey);
  }

  getOverlayProps = () => ({
    isOpen         : this.state.isOpen,
    origin         : this.state.origin,
    renderHeader   : this.props.renderHeader,
    renderFooter   : this.props.renderFooter,
    swipeToDismiss : this.props.swipeToDismiss,
    springConfig   : this.props.springConfig,
    backgroundColor: this.props.backgroundColor,
    children       : this.children, //this.props.children,//this.getContent(),
    activeProps    : this.props.activeProps,
    images         : this.props.images,
    renderContent  : this.props.renderContent,
    didOpen        : this.props.didOpen,
    willClose      : this.props.willClose,
    onClose        : this.onClose,
  })

  open = () => {
    this._root.measure((ox, oy, width, height, px, py) => {
      this.props.onOpen();

      this.setState({
        isOpen     : (this.props.navigator ? true : false),
        isAnimating: true,
        origin     : {
          width,
          height,
          x: px,
          y: py,
        },
      }, () => {
        this.props.didOpen();
        if (this.props.navigator) {
          const route = {
            component: LightboxOverlay,
            passProps: this.getOverlayProps(),
          };
          const routes = this.props.navigator.getCurrentRoutes();
          routes.push(route);
          this.props.navigator.immediatelyResetRouteStack(routes);
        } else {
          this.setState({
            isOpen: true,
          });
        }
        setTimeout(() => {
          // don't hide old picture
          // this._root && this.state.layoutOpacity.setValue(0);
        });
      });
    });
  }

  close = () => {
    throw new Error('Lightbox.close method is deprecated. Use renderHeader(close) prop instead.')
  }

  onClose = () => {
    this.state.layoutOpacity.setValue(1);
    if (isIOS) {
      StatusBar.setHidden(false, 'fade');
    }
    // reset openval 为了重新的动画效果
    if (this.refs && this.refs.ligthBoxOverlay && this.refs.ligthBoxOverlay.resetOpenVal) {
      this.refs.ligthBoxOverlay.resetOpenVal();
    }
    this.setState({
      isOpen: false,
    }, this.props.onClose);
    if (this.props.navigator) {
      const routes = this.props.navigator.getCurrentRoutes();
      routes.pop();
      this.props.navigator.immediatelyResetRouteStack(routes);
    }
  }

  _renderMask = () => {
    if (this.props.renderMask) {
      return (
        <View style={{ position: 'absolute' }}>
          {this.props.renderMask()}
        </View>
      );
    }
    return null;
  }

  render() {
    // measure will not return anything useful if we dont attach a onLayout handler on android
    return (
      <View
        ref={component => this._root = component}
        style={this.props.style}
        onLayout={() => {
        }}
      >
        <Animated.View style={{ opacity: this.state.layoutOpacity }}>
          <TouchableHighlight
            underlayColor={this.props.underlayColor}
            onPress={this.open}
          >
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              {this.props.children}
              {this._renderMask()}
            </View>
          </TouchableHighlight>
        </Animated.View>
        {
          this.props.navigator ? false :
            <LightboxOverlay ref='ligthBoxOverlay' galleryMode={this.props.galleryMode} GKey={this.props.GKey}
                             currentIndex={this.props.currentIndex} {...this.getOverlayProps()} />
        }
      </View>
    );
  }
}
