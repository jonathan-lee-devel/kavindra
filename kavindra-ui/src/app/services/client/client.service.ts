import {HttpClient} from '@angular/common/http';
import {inject, Injectable} from '@angular/core';

import {TenantStore} from '../../+state/tenant/tenant.store';
import {POSTSuccessDto} from '../../dtos/POSTSuccess.dto';
import {ClientDto} from '../../dtos/client/Client.dto';

@Injectable({
  providedIn: 'root',
})
export class ClientService {
  private readonly httpClient = inject(HttpClient);
  private readonly tenantStore = inject(TenantStore);

  fetchIsSubdomainAvailable(subdomain: string) {
    return this.httpClient.post<{
      isSubdomainAvailable: boolean;
      subdomain: string;
    }>(
        this.tenantStore.getFullRequestUrl('v1/clients/is-subdomain-available'),
        {subdomain},
    );
  }

  registerNewClientAndProjectWithPlan(
      clientDisplayName: string,
      subdomain: string,
      isBugReportsEnabled: boolean,
      isFeatureRequestsEnabled: boolean,
      isFeatureFeedbackEnabled: boolean,
  ) {
    return this.httpClient.post<POSTSuccessDto & { clientId: string }>(
        this.tenantStore.getFullRequestUrl('v1/clients/create'),
        {
          clientDisplayName,
          subdomain,
          isBugReportsEnabled,
          isFeatureRequestsEnabled,
          isFeatureFeedbackEnabled,
        },
    );
  }

  fetchClientsWhereInvolved() {
    return this.httpClient.get<ClientDto[]>(
        this.tenantStore.getFullRequestUrl('v1/clients/where-involved'),
    );
  }

  fetchIsMemberOfAnything() {
    return this.httpClient.get<{isMemberOfAnything: boolean}>(
        this.tenantStore.getFullRequestUrl('v1/clients/is-member-of-anything'),
    );
  }
}
