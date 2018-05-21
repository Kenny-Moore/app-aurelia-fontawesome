export function configure(config) {
  config.globalResources(PLATFORM.moduleName('./elements/contact-list/contact-list'))
        .globalResources(PLATFORM.moduleName('./elements/font-awesome-icon/font-awesome-icon'));
}
