import * as fs from 'node:fs';
import * as path from 'node:path';

import {Cache, CACHE_MANAGER} from '@nestjs/cache-manager';
import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {AuthUser} from '@supabase/supabase-js';

import {
  EnvironmentVariables,
  NodeEnvironment,
} from '../../../../lib/config/environment';
import {supabaseUserIdKey} from '../../../../lib/constants/auth/supabase-user-id.constants';
import {ClientsService} from '../../../clients/services/clients/clients.service';
import {CreateProjectDto} from '../../dto/CreateProject.dto';
import {UpdateProjectDto} from '../../dto/UpdateProject.dto';
import {ProjectsRepositoryService} from '../../repositories/projects-repository/projects-repository.service';

@Injectable()
export class ProjectsService implements OnModuleInit {
  constructor(
    private readonly logger: Logger,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly projectsRepository: ProjectsRepositoryService,
    private readonly clientsService: ClientsService,
    private readonly configService: ConfigService<EnvironmentVariables>,
  ) {}

  async onModuleInit() {
    this.logger.log('Projects service initializing, clearing cache...');
    await this.cacheManager.reset();
    this.logger.log('Projects service initialized, cleared cache');
  }

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

  async getFeedbackWidgetScript(clientSubdomain: string) {
    if (clientSubdomain === 'www' || clientSubdomain === 'kavindra') {
      return this.generateWidgetInitScript(clientSubdomain, {
        name: 'Kavindra',
        subdomain: clientSubdomain,
        isBugReportsEnabled: true,
        isFeatureRequestsEnabled: true,
        isFeatureFeedbackEnabled: true,
      });
    }
    const [project] =
      await this.projectsRepository.findBySubdomain(clientSubdomain);
    return this.generateWidgetInitScript(clientSubdomain, {
      ...project,
    });
  }

  async getWidgetScript() {
    return fs.readFileSync(
      path.join(__dirname, '../../../../..', 'widget/dist/kavindra-widget.js'),
      'utf8',
    );
  }

  private async generateWidgetInitScript(
    clientSubdomain: string,
    returnedProject: unknown,
  ) {
    let widgetSrc: string;
    if (
      this.configService.getOrThrow<NodeEnvironment>('NODE_ENV') ===
      'production'
    ) {
      widgetSrc = `https://${clientSubdomain}.api.kavindra.io/v1/kavindra-widget.js`;
    } else if (
      this.configService.getOrThrow<NodeEnvironment>('NODE_ENV') === 'staging'
    ) {
      widgetSrc = `https://${clientSubdomain}.api.kavindra-staging.com/v1/kavindra-widget.js`;
    } else {
      widgetSrc = `http://${clientSubdomain}.api.kavindra.io:3000/v1/kavindra-widget.js`;
    }
    return `
        (function (w,d,s,o,f,js,fjs) {
            w['JS-Widget']=o;w[o] = w[o] || function () { (w[o].q = w[o].q || []).push(arguments) };
            js = d.createElement(s), fjs = d.getElementsByTagName(s)[0];
            js.id = o; js.src = f; js.async = 1; fjs.parentNode.insertBefore(js, fjs);
        }(window, document, 'script', 'mw', '${widgetSrc}'));
        mw('init', { project: ${returnedProject ? JSON.stringify(returnedProject) : null} } );
        mw('message', { project: ${returnedProject ? JSON.stringify(returnedProject) : null} });
    `;
  }
}
