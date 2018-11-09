/*
  @flow weak
 */

import React from 'react' // peer-dependency
import mitt from 'mitt' // DEPENDENCY #1

export const PortalContext = React.createContext()

export class PortalProvider extends React.Component {
  _emitter = new mitt()

  portals = new Map()

  // componentWillUnmount() {
  //   this._emitter = null
  // }

  // 변경시 통지 요청 등록
  portalSub = (name, callback) => {
    const emitter = this._emitter
    if (emitter) {
      emitter.on(name, callback)
    }
  }

  // 변경시 통지 요청 해제
  portalUnsub = (name, callback) => {
    const emitter = this._emitter
    if (emitter) {
      emitter.off(name, callback)
    }
  }

  // 변경
  portalSet = (name, value) => {
    this.portals.set(name, value)
    if (this._emitter) {
      this._emitter.emit(name)
    }
  }

  portalGet = name => this.portals.get(name) || null

  // 변경
  render() {
    return (
      <PortalContext.Provider value={{
          portalSub: this.portalSub,
          portalUnsub: this.portalUnsub,
          portalSet: this.portalSet,
          portalGet: this.portalGet,
        }}>
        {this.props.children}
      </PortalContext.Provider>
    )
  }
}

export class BlackPortal extends React.PureComponent {
  static contextType = PortalContext

  props: {
    name: string,
    children?: *,
  }

  componentDidMount() {
    const { name, children } = this.props
    const { portalSet } = this.context
    portalSet && portalSet(name, children)
  }

  componentDidUpdate(newProps) {
    const oldProps = this.props
    const { name, children } = newProps
    const { portalSet } = this.context
    if (oldProps.children != newProps.children) {
      portalSet && portalSet(name, children)
    }
  }

  componentWillUnmount() {
    const { name } = this.props
    const { portalSet } = this.context
    portalSet && portalSet(name, null)
  }

  render() {
    const { name } = this.props
    return null
  }
}

export class WhitePortal extends React.PureComponent {
  static contextType = PortalContext

  props: {
    name: string,
    children?: *,
    childrenProps?: *,
  }

  componentDidMount() {
    const { name } = this.props
    const { portalSub } = this.context
    portalSub && portalSub(name, this.forceUpdater)
  }

  componentWillUnmount() {
    const { name } = this.props
    const { portalUnsub } = this.context
    portalUnsub && portalUnsub(name, this.forceUpdater)
  }

  forceUpdater = () => this.forceUpdate()

  render() {
    const { name, children, childrenProps } = this.props
    const { portalGet } = this.context
    const portalChildren = (portalGet && portalGet(name)) || children
    return (
      (childrenProps && portalChildren ?
        React.cloneElement(React.Children.only(portalChildren), childrenProps) :
        portalChildren) || null
    )
  }
}
