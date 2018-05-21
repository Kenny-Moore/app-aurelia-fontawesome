import { containerless, customElement, bindable, bindingMode, inject, inlineView, noView, ViewCompiler, ViewSlot, Container, ViewResources} from 'aurelia-framework';
import { ValidationRules } from 'aurelia-validation';
import { HTMLSanitizer } from 'aurelia-templating-resources'

import fontawesome from '@fortawesome/fontawesome';

import { faNormalizeIconSpec } from './utils/normalize-icon-spec.util';
import { objectWithKey } from './utils/object-with-keys.util';
import { faClassList } from './utils/classlist.util';

import { faWarnIfIconHtmlMissing } from './errors/warn-if-icon-html-missing';
import { faWarnIfIconSpecMissing } from './errors/warn-if-icon-spec-missing';
import { faNotFoundIconHtml } from './errors/not-found-icon-html';

@customElement('font-awesome-icon')
@containerless
@noView
@inject(HTMLSanitizer, ViewCompiler, ViewSlot, Container, ViewResources)
export class FontAwesomeIcon {
	@bindable({changeHandler:'onChanges'}) border = false;
	@bindable({changeHandler:'onChanges'}) fixedWidth = false;
	@bindable({changeHandler:'onChanges'}) flip = null;
  @bindable({changeHandler:'onChanges'}) icon = "";
	@bindable({changeHandler:'onChanges'}) mask = null;
	@bindable({changeHandler:'onChanges'}) listItem = false;
	@bindable({changeHandler:'onChanges'}) pull = null;
	@bindable({changeHandler:'onChanges'}) pulse = false;
	@bindable({changeHandler:'onChanges'}) rotation = null;
	@bindable({changeHandler:'onChanges'}) size = null;
	@bindable({changeHandler:'onChanges'}) spin = false;
	@bindable({changeHandler:'onChanges'}) transform = null;
	@bindable({changeHandler:'onChanges'}) symbol = false;
	
  constructor(sanitizer, vc, vs, container, resources) {
    this.viewCompiler = vc;
    this.viewSlot = vs;
    this.container = container;
    this.resources = resources;

    this.sanitizer = sanitizer;  
    this.iconHTML = "";
    this.params = null;
    this._icon = null;
    this.iconSpec = null;
  }

  created(parent, view) {
    this.view = view;
  }

  bind(bindingContext, overrideContext){
    this.bindingContext = bindingContext;
    this.updateIconSpec();
    this.updateParams();
    this.updateIcon();
    this.renderIcon();
  }

  attached() {
  }

  onChanges(oldValue, newValue) {
    if (newValue !== oldValue) {
      this.updateIconSpec();
      this.updateParams();
      this.updateIcon();
      this.renderIcon();
    }
  }

  /**
   * Updating icon spec.
   */
  updateIconSpec() {
    this.iconSpec = faNormalizeIconSpec(this.icon);
  }

  /**
   * Updating params by component props.
   */
  updateParams() {
    const classOpts = {
      flip: this.flip,
      spin: this.spin !== false,
      pulse: this.pulse !== false,
      border: this.border !== false,
      inverse: this.inverse,
      listItem: this.listItem !== false,
      size: this.size || null,
      pull: this.pull || null,
      rotate: this.rotate || null,
      fixedWidth: this.fixedWidth !== false
    };

    const classes = objectWithKey('classes', [...faClassList(classOpts), ...this.classes]);
    const mask = objectWithKey('mask', faNormalizeIconSpec(this.mask));
    const parsedTransform = typeof this.transform === 'string' ? fontawesome.parse.transform(this.transform) : this.transform;
    const transform = objectWithKey('transform', parsedTransform);

    const { title, styles, symbol } = this;
    this.params = Object.assign({}, { title }, { styles }, { symbol }, classes, transform, mask)
  }

  /**
   * Updating icon by params and icon spec.
   */
  updateIcon() {
    this._icon = fontawesome.icon(this.iconSpec, this.params);
  }

  renderIcon () { 
 
    faWarnIfIconSpecMissing(this.iconSpec);
    faWarnIfIconHtmlMissing(this._icon, this.iconSpec);  

    this.iconHTML = this._icon ? this._icon.html.join('\n') : faNotFoundIconHtml;

    var viewFactory =  this.viewCompiler.compile('<template>' + this.iconHTML + '</template>', this.resources);
    var view = viewFactory.create(this.container, this.bindingContext);
    this.viewSlot.removeAll();
    this.viewSlot.add(view);
    this.viewSlot.attached();
  }
}
ValidationRules
	.ensure('flip')
		.satisfies(value => ['horizontal', 'vertical', 'both'].indexOf(value) > -1)
	.ensure('icon')
		.required()
	.ensure('pull')
		.satisfies(value => ['right', 'left'].indexOf(value) > -1)
	.ensure('rotation')
		.satisfies(value => [90, 180, 270].indexOf(value) > -1)
	.ensure('rotation')
		.satisfies(value => ['lg', 'xs', 'sm', '1x', '2x', '3x', '4x', '5x', '6x', '7x', '8x', '9x', '10x'].indexOf(value) > -1)
	.on(FontAwesomeIcon);
