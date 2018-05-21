# app-aurelia-fontawesome
Example App that Demonstrates an Unofficial Font Awesome 5 (Pro) Aurelia Component

## Getting Started
To get the example app running, follow these steps:

### Setting Up Your Machine
This example app was built with the Aurelia CLI. Aurelia's documentation offers [a tutorial, ](https://aurelia.io/docs/tutorials/creating-a-contact-manager#setting-up-your-machine) that will you get started using Aurelia's CLI

If you've already setup your machine with the CLI, you can skip to the next section. If not, then please install the following CLI prerequisites:

* Install NodeJS version 4.x or above.
** You can download it [here](https://nodejs.org/en/) .
* Install a Git Client
** Here's [a standard client](https://git-scm.com/) .

Once you have the prerequisites installed, you can install the Aurelia CLI itself. From the command line, use npm to install the CLI globally:
  ```shell
  npm install aurelia-cli -g
  ```

### Using Fontawesome Pro Version
This app was set up to be used with Fontawesome 5 Pro (I will create a test app using the Free Version later). Access to the Pro packages, require you to configure the @fortawesome scope to use their Pro NPM registry. You will need to create a `.npmrc` file in the root folder that contains the following:

  ```shell
  npm config set "@fortawesome:registry" https://npm.fontawesome.com/
  npm config set "//npm.fontawesome.com/:_authToken" [**YOUR AUTHTOKEN GOES HERE**]
  ```

For more help: follow the instructions here: https://fontawesome.com/how-to-use/use-with-node-js to do this.

## Running the App
We should be able to run the application now, using au run --watch. Open a new browser tab and 
  ```shell
  au run --watch
  ```
Check the output for to find out where your project is running:
  ```shell
  C:\app-aurelia-fontawesome>au run --watch
  Starting 'configureEnvironment'...
  Finished 'configureEnvironment'
  Starting 'runWebpack'...
  Project is running at http://localhost:8080 // <<<< [Copy and paste this into the browser]
  ```


## Using the Custom Element
This example app has already registered the custom fontawesome icon element as a global feature, so it can be used anywhere in the test app. All Pro Font Packages are currently loaded.

### The Basics

The `icon` property of the `FaIcon` custom element can be used in the following way:

Shorthand that assumes a prefix of `fas`:

```javascript
<fa-icon icon="spinner"></fa-icon>
```

Explicit prefix:

```javascript
<fa-icon icon="['far', 'spinner']"></fa-icon>
```
or
```javascript
<fa-icon icon.bind="['far', 'spinner']"></fa-icon>
```
(note that .bind is not necessary even though we are using an array)


Explicit icon definition (this is pseudo-code, see examples below for more detail):

```javascript
import faCoffee from '@fortawesome/fontawesome-free-solid/faCoffee'

<fa-icon icon.bind="getIcon"></fa-icon>

function getIcon () {
  return faCoffee
}
```

### More Features

Spin and pulse animation:

```javascript
<fa-icon icon="spinner" spin ></fa-icon>
<fa-icon icon="spinner" pulse ></fa-icon>
```

Fixed width:

```javascript
<fa-icon icon="spinner" fixed-width ></fa-icon>
```

Border:

```javascript
<fa-icon icon="spinner" border ></fa-icon>
```

List items:

```javascript
<fa-icon icon="spinner" list-item ></fa-icon>
```

Flip horizontally, vertically, or both:

```javascript
<fa-icon icon="spinner" flip="horizontal"></fa-icon>
<fa-icon icon="spinner" flip="vertical"></fa-icon>
<fa-icon icon="spinner" flip="both"></fa-icon>
```

Size:

```javascript
<fa-icon icon="spinner" size="xs"></fa-icon>
<fa-icon icon="spinner" size="lg"></fa-icon>
<fa-icon icon="spinner" size="6x"></fa-icon>
```

Rotate:

```javascript
<fa-icon icon="spinner" rotation="90"></fa-icon>
<fa-icon icon="spinner" rotation="180"></fa-icon>
<fa-icon icon="spinner" rotation="270"></fa-icon>
```

Pull left or right:

```javascript
<fa-icon icon="spinner" pull="left"></fa-icon>
<fa-icon icon="spinner" pull="right"></fa-icon>
```

### Advanced Features

Power Transforms:

```javascript
<fa-icon icon="spinner" transform="shrink-6 left-4"></fa-icon>
<fa-icon icon="spinner" transform="{ rotate: 42 }"></fa-icon>
```

Masking:

```javascript
<fa-icon icon="coffee" mask="['far', 'circle']"></fa-icon>
```

Symbols:

```javascript
<font-awesome-icon icon="edit" symbol ></fa-icon>
<font-awesome-icon icon="edit" symbol="edit-icon" ></fa-icon>
```
