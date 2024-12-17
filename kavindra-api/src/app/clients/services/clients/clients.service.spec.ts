import {faker} from '@faker-js/faker/locale/en';
import {
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import {Mocked, TestBed} from '@suites/unit';
import {AuthUser} from '@supabase/supabase-js';

import {ClientsService} from './clients.service';
import {
  createMockAuthUser,
  createMockCreateClientDto,
} from '../../../../lib/util/tests.helpers.util';
import {CreateClientDto} from '../../dto/CreateClient.dto';
import {ClientsRepositoryService} from '../../repositories/clients-repository/clients-repository.service';

describe('ClientsService', () => {
  let service: ClientsService;
  let mockClientsRepository: Mocked<ClientsRepositoryService>;
  let mockLogger: Mocked<Logger>;

  beforeEach(async () => {
    const {unit, unitRef} = await TestBed.solitary(ClientsService).compile();
    service = unit;
    mockClientsRepository = unitRef.get<ClientsRepositoryService>(
      ClientsRepositoryService,
    );
    mockLogger = unitRef.get<Logger>(Logger);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(mockClientsRepository).toBeDefined();
    expect(mockLogger).toBeDefined();
  });

  it('should throw bad request exception if client subdomain is not available', async () => {
    const mockUser = createMockAuthUser();
    const mockCreateClientDto: CreateClientDto = createMockCreateClientDto();

    mockClientsRepository.isExistsSubdomain.mockResolvedValue(true);
    mockClientsRepository.getClientsWhereUserInvolved.mockResolvedValue([]);

    await expect(
      service.createClient(
        mockUser as unknown as AuthUser,
        mockCreateClientDto,
      ),
    ).rejects.toThrow(new BadRequestException('Subdomain already exists'));
  });

  it('should throw internal server error if any element fails to create', async () => {
    const mockUser = createMockAuthUser();
    const mockCreateClientDto = createMockCreateClientDto();

    mockClientsRepository.isExistsSubdomain.mockResolvedValue(false);
    mockClientsRepository.getClientsWhereUserInvolved.mockResolvedValue([]);
    mockClientsRepository.registerNewClientWithTransaction.mockResolvedValue({
      createdClient: null,
      createdSubdomain: null,
      createdProject: null,
    });

    await expect(
      service.createClient(
        mockUser as unknown as AuthUser,
        mockCreateClientDto,
      ),
    ).rejects.toThrow(new InternalServerErrorException());
  });

  it('should create new client', async () => {
    const mockUser = createMockAuthUser();
    const mockCreateClientDto = createMockCreateClientDto();
    const clientId = faker.string.uuid();

    mockClientsRepository.getClientsWhereUserInvolved.mockResolvedValue([]);
    mockClientsRepository.registerNewClientWithTransaction.mockResolvedValue({
      createdClient: {
        id: clientId,
      },
      createdSubdomain: {},
      createdProject: {},
    } as any);

    const result = await service.createClient(
      mockUser as unknown as AuthUser,
      mockCreateClientDto,
    );

    expect(result.isSuccessful).toBe(true);
    expect(result.clientId).toStrictEqual(clientId);
  });
});
