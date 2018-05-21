import {PLATFORM} from 'aurelia-pal';

export class App {
  icons = [
    { id: 0, name: 'user', prefix: 'fas' },
    { id: 1, name: 'user', prefix: 'fal' },
    { id: 2, name: 'user-tie', prefix: 'fas' },
    { id: 3, name: 'user-tie', prefix: 'fal' },
    { id: 4, name: 'user-secret', prefix: 'fas' },
    { id: 5, name: 'user-secret', prefix: 'fal' }
  ];
  defaultIcon = { name: 'users-cog', prefix: 'fal' };
  selectedIcon = null;
  iconType = {
    fas: 'solid',
    fal: 'light'
  };

  configureRouter(config, router){
    config.title = 'Contacts';
    config.map([
      { route: '',              moduleId: PLATFORM.moduleName('no-selection'),   title: 'Select' },
      { route: 'contacts/:id',  moduleId: PLATFORM.moduleName('contact-detail'), name:'contacts' }
    ]);
    this.router = router;

  }
}
  