import {faker} from '@faker-js/faker/locale/en';
import {Mocked, TestBed} from '@suites/unit';

import {ClientsController} from './clients.controller';
import {ApiGatewayRequestHeadersDto} from '../../../../lib/auth/api-gateway/domain/ApiGatewayRequestHeaders.dto';
import {createMockCreateClientDto} from '../../../../lib/util/tests.helpers.util';
import {ClientsService} from '../../services/clients/clients.service';

describe('ClientsController', () => {
  let controller: ClientsController;
  let mockClientsService: Mocked<ClientsService>;

  beforeEach(async () => {
    const {unit, unitRef} = await TestBed.solitary(ClientsController).compile();

    controller = unit;
    mockClientsService = unitRef.get<ClientsService>(ClientsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(mockClientsService).toBeDefined();
  });

  it('should register new client', async () => {
    const mockUser = {
      requestingUserEmail: faker.internet.email(),
      requestingUserSubjectId: faker.string.uuid(),
    };

    const mockCreateClientDto = createMockCreateClientDto();

    mockClientsService.createClient.mockResolvedValue({
      isSuccessful: true,
      clientId: faker.string.uuid(),
    });

    const result = await controller.registerNewClient(
      mockUser as ApiGatewayRequestHeadersDto,
      mockCreateClientDto,
    );

    expect(result.isSuccessful).toBe(true);
    expect(mockClientsService.createClient).toHaveBeenCalledWith(
      mockUser as unknown as ApiGatewayRequestHeadersDto,
      mockCreateClientDto,
    );
  });

  it('should fetch is subdomain available', async () => {
    const subdomain = faker.internet.domainName().split('.')[0];

    mockClientsService.checkIfSubdomainAvailable.mockResolvedValue({
      isSubdomainAvailable: false,
      subdomain,
    });

    const result = await controller.isSubdomainAvailable({subdomain});

    expect(result.isSubdomainAvailable).toBe(false);
    expect(result.subdomain).toStrictEqual(subdomain);
    expect(mockClientsService.checkIfSubdomainAvailable).toHaveBeenCalledWith({
      subdomain,
    });
  });
});
