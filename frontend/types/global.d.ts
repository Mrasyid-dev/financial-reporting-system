/// <reference types="react" />
/// <reference types="react-dom" />

declare namespace React {
  type ReactNode = import('react').ReactNode
  type FormEvent<T = Element> = import('react').FormEvent<T>
  type ChangeEvent<T = Element> = import('react').ChangeEvent<T>
}

