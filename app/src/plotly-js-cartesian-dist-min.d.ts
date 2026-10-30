declare module 'plotly.js-cartesian-dist-min' {
  const Plotly: {
    react(
      root: HTMLElement,
      data: unknown[],
      layout?: Record<string, unknown>,
      config?: Record<string, unknown>,
    ): Promise<unknown>;
    purge(root: HTMLElement): void;
    Plots: { resize(root: HTMLElement): void };
  };
  export default Plotly;
}
