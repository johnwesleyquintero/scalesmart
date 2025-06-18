declare module '*.png' {
  const value: string;
  export default value;
}
// c:/Users/johnw/portfolio/src/types/custom.d.ts
declare module '*.csv' {
  const content: string;
  export default content;
}

// Add any other custom type declarations here if needed.

export interface TagifyCustomEvent extends CustomEvent {
  detail: {
    tagify: {
      value: string;
    };
  };
}

export {};
