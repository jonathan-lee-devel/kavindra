import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import {AuthUser} from '@supabase/supabase-js';

import {supabaseUserIdKey} from '../../../../lib/constants/auth/supabase-user-id.constants';
import {ClientsService} from '../../../clients/services/clients/clients.service';
import {CreateProjectDto} from '../../dto/CreateProject.dto';
import {UpdateProjectDto} from '../../dto/UpdateProject.dto';
import {ProjectsRepositoryService} from '../../repositories/projects-repository/projects-repository.service';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly projectsRepository: ProjectsRepositoryService,
    private readonly clientsService: ClientsService,
  ) {}

  async createProject(
    currentUser: AuthUser,
    createProjectDto: CreateProjectDto,
  ) {
    const client = await this.clientsService.getClientById(
      currentUser,
      createProjectDto.clientId,
    );
    if (
      !client.admins
        .map((admin) => admin.supabaseUserId)
        .includes(currentUser[supabaseUserIdKey])
    ) {
      throw new ForbiddenException();
    }
    if (
      !(
        await this.clientsService.checkIfSubdomainAvailable(
          {
            subdomain: createProjectDto.subdomain,
          },
          currentUser,
        )
      ).isSubdomainAvailable
    ) {
      return new BadRequestException('Subdomain already exists');
    }
    return this.projectsRepository.create(currentUser, createProjectDto);
  }

  async getProjectsWhereInvolved(currentUser: AuthUser) {
    return this.projectsRepository.getProjectsWhereInvolved(currentUser);
  }

  async getProjectById(currentUser: AuthUser, projectId: string) {
    const project = await this.projectsRepository.findById(projectId);
    await this.clientsService.getClientById(currentUser, project.clientId); // Will throw not found or forbidden exception
    return project;
  }

  async updateProjectById(
    currentUser: AuthUser,
    projectId: string,
    updateProjectDto: UpdateProjectDto,
  ) {
    const project = await this.projectsRepository.findById(projectId);
    const client = await this.clientsService.getClientById(
      currentUser,
      project.clientId,
    ); // Will throw not found or forbidden exception
    if (
      !client.admins
        .map((admin) => admin.supabaseUserId)
        .includes(currentUser[supabaseUserIdKey])
    ) {
      throw new ForbiddenException();
    }
    return this.projectsRepository.updateProjectById(
      projectId,
      updateProjectDto,
    );
  }

  async getProjectsForClient(currentUser: AuthUser, clientId: string) {
    await this.clientsService.getClientById(currentUser, clientId); // Will throw not found or forbidden exception
    return this.projectsRepository.getProjectsForClient(clientId);
  }
}
