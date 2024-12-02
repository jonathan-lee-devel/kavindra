import {HttpClient} from '@angular/common/http';
import {inject, Injectable} from '@angular/core';

import {TenantStore} from '../../+state/tenant/tenant.store';
import {ProjectDto} from '../../dtos/projects/Project.dto';

@Injectable({
  providedIn: 'root',
})
export class ProjectsService {
  private readonly httpClient = inject(HttpClient);
  private readonly tenantStore = inject(TenantStore);

  fetchProjectsWhereInvolved() {
    return this.httpClient.get<ProjectDto[]>(this.tenantStore.getFullRequestUrl('v1/projects/where-involved'));
  }

  fetchProjectsForClient(clientId: string) {
    return this.httpClient.get<ProjectDto[]>(this.tenantStore.getFullRequestUrl(`v1/projects/for-client/${clientId}`));
  }

  fetchProjectById(projectId: string) {
    return this.httpClient.get<ProjectDto>(this.tenantStore.getFullRequestUrl(`v1/projects/${projectId}`));
  }

  updateProjectById(projectId: string, project: ProjectDto) {
    return this.httpClient.put<ProjectDto>(this.tenantStore.getFullRequestUrl(`v1/projects/${projectId}`), project);
  }
}
