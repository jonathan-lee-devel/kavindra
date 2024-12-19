import {CacheModule} from '@nestjs/cache-manager';
import {Module} from '@nestjs/common';
import {ConfigModule} from '@nestjs/config';
import {APP_GUARD, RouterModule} from '@nestjs/core';
import {EventEmitterModule} from '@nestjs/event-emitter';
import {ThrottlerGuard, ThrottlerModule} from '@nestjs/throttler';

import {routes} from './app.routes';
import {ClientsModule} from './clients/clients.module';
import {EmbedScriptsModule} from './embed-scripts/embed-scripts.module';
import {EpicsModule} from './epics/epics.module';
import {IssuesModule} from './issues/issues.module';
import {PaymentsModule} from './payments/payments.module';
import {ProjectsModule} from './projects/projects.module';
import {ReleasesModule} from './releases/releases.module';
import {SprintsModule} from './sprints/sprints.module';
import {UsersModule} from './users/users.module';
import {AuthModule} from '../lib/auth/auth.module';
import {SupabaseAuthGuard} from '../lib/auth/supabase/guards/supabase-auth/supabase-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    RouterModule.register(routes),
    EventEmitterModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        ttl: 5_000,
        limit: 10,
      },
    ]),
    CacheModule.register({
      isGlobal: true,
    }),
    AuthModule,
    IssuesModule,
    ReleasesModule,
    ClientsModule,
    EpicsModule,
    SprintsModule,
    UsersModule,
    ProjectsModule,
    PaymentsModule,
    EmbedScriptsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: SupabaseAuthGuard,
    },
  ],
})
export class AppModule {}
