export interface IPlatform {
  name: 'web' | 'mobile' | 'desktop';
  version: string;
  isOffline(): boolean;
}
