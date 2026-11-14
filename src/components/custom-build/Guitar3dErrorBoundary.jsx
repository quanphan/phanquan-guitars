import { Component } from "react";

export default class Guitar3dErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch() {
    // Isolate WebGL / R3F failures from the rest of the wizard.
  }

  componentDidUpdate(prevProps) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  render() {
    if (this.state.error) {
      return typeof this.props.fallback === "function"
        ? this.props.fallback(this.state.error)
        : this.props.fallback || null;
    }
    return this.props.children;
  }
}
