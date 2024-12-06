import {Component} from '@angular/core';
import {RouterLink} from '@angular/router';

import {RoutePath} from '../../../../../app.routes';
import {rebaseRoutePath} from '../../../../../util/router/Router.utils';

@Component({
  selector: 'app-create-client-intro-page',
  imports: [RouterLink],
  standalone: true,
  templateUrl: './create-client-intro-page.component.html',
  styleUrl: './create-client-intro-page.component.scss',
})
export class CreateClientIntroPageComponent {
  protected readonly rebaseRoutePath = rebaseRoutePath;
  protected readonly RoutePath = RoutePath;
}
