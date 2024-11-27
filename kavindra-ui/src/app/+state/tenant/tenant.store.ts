import {signalStore, withMethods, withState} from '@ngrx/signals';

import {environment} from '../../../environments/environment';

export type ApiEnvironment = 'local' | 'staging' | 'production';

type TenantState = {
  isLoading: boolean;
  tenantId: string;
  subdomain: string;
  apiEnvironment: ApiEnvironment;
  customHostname: string | null;
};

const initialState: TenantState = {
  isLoading: true,
  tenantId: '',
  apiEnvironment: environment.API_ENVIRONMENT as ApiEnvironment,
  subdomain: 'www',
  customHostname: null,
};

export const TenantStore = signalStore(
    {providedIn: 'root'},
    withState(initialState),
    withMethods((store) => {
      return {
        getFullRequestUrl: (apiPath: string) => {
          const scheme = store.apiEnvironment() === 'local' ? 'http' : 'https';
          const port = store.apiEnvironment() === 'local' ? '3000' : '443';
          if (window.location.hostname.toLowerCase().includes('localhost')) {
            return `${scheme}://${window.location.hostname}:${port}/${apiPath}`;
          }
          return store.customHostname() ?
          `https://${store.customHostname()}/${apiPath}` :
          `${scheme}://${window.location.hostname.toLowerCase().split('.')[0]}.${store.apiEnvironment()}.api.kavindra.io:${port}/${apiPath}`;
        },
      };
    }),
);
