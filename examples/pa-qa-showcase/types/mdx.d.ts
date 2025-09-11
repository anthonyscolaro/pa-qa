declare module '*.mdx' {
  let MDXComponent: (props: any) => JSX.Element;
  export default MDXComponent;
}

declare module '@mdx-js/react' {
  import * as React from 'react';
  
  type ComponentMap = {
    [key: string]: React.ComponentType<any>;
  };

  interface MDXProviderProps {
    children: React.ReactNode;
    components?: ComponentMap;
  }

  export const MDXProvider: React.ComponentType<MDXProviderProps>;
  export const useMDXComponents: (components?: ComponentMap) => ComponentMap;
}