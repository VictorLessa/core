'use strict'

/*
 * adonis-fold
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const CE = require('../Exceptions')

/**
 * @module Adonis
 * @submodule fold
 */

/**
 * This class will resolve a namespace or a pattern
 * from the IoC container. Think of it as a friend
 * to the IoC container for resolving namespaces
 * without worrying where they live.
 *
 * @class Resolver
 * @constructor
 */
class Resolver {
  constructor (Ioc, directories, appNamespace, forDirectory = null) {
    this._validateDirectories(directories)
    this._validateNamespace(appNamespace)

    /**
     * Reference to the IoC container
     * instance.
     *
     * @type {Object}
     *
     * @attribute Ioc
     */
    this.Ioc = Ioc

    // private props
    this._directories = directories
    this._appNamespace = appNamespace
    this._forDirectory = forDirectory
  }

  /**
   * Validate directories to exists and is an object
   *
   * @method _validateDirectories
   *
   * @param  {Object}             directories
   *
   * @return {void}
   *
   * @private
   */
  _validateDirectories (directories) {
    if (!directories || typeof (directories) !== 'object') {
      throw CE.InvalidArgumentException.invalidParameters('Cannot initiate resolver without registering directories')
    }
  }

  /**
   * Validate appNamespace to exist.
   *
   * @method _validateNamespace
   *
   * @param  {String}           appNamespace
   *
   * @return {void}
   *
   * @private
   */
  _validateNamespace (appNamespace) {
    if (!appNamespace) {
      throw CE.InvalidArgumentException.invalidParameters('Cannot initiate resolver without registering appNamespace')
    }
  }

  /**
   * Makes the correct namespace for a binding. Based upon
   * the app namespace and the directory for which the
   * namespace should be created.
   *
   * @method _makeAppNamespace
   *
   * @param  {String}          binding
   *
   * @return {String}
   *
   * @private
   */
  _makeAppNamespace (binding) {
    if (!this._directories[this._forDirectory]) {
      throw new Error(`Cannot translate binding, since ${this._forDirectory} is not registered under directories`)
    }
    const basePath = `${this._appNamespace}/${this._directories[this._forDirectory]}`
    return `${basePath}/${binding.replace(basePath, '')}`
  }

  /**
   * Normalizes the binding name by removing multiple
   * slashes from start,end and the middle of the
   * binding
   *
   * @method _normalize
   *
   * @param  {String}   binding
   *
   * @return {String}
   *
   * @private
   */
  _normalize (binding) {
    return binding.replace(/\/{2,}/g, '/').replace(/\/$/, '')
  }

  /**
   * Translates a binding into a valid namespace, ready to
   * be resolved via Ioc container
   *
   * @method translate
   *
   * @param  {String}  binding
   *
   * @return {String}
   *
   * @example
   * ```js
   * resolver.for('httpControllers').translate('HomeController')
   * // returns - App/Controllers/HomeController
   * ```
   */
  translate (binding) {
    if (typeof (binding) !== 'string') {
      throw new Error(`Cannot translate ${typeof (binding)}, binding should always be a valid string.`)
    }

    if (binding.startsWith('@provider:')) {
      return this._normalize(binding.replace('@provider:', ''))
    }
    return this._forDirectory ? this._normalize(this._makeAppNamespace(binding)) : this._normalize(binding)
  }

  /**
   * Resolves the binding from the IoC container. This
   * method is a combination of `translate` and
   * `Ioc.make` function.
   *
   * @method resolve
   *
   * @param  {String} binding
   *
   * @return {Mixed}
   */
  resolve (binding) {
    binding = this.translate(binding)
    return this.Ioc.make(binding)
  }

  /**
   * Resolves a function by translating the binding and
   * then validating the existence of the method on
   * the binding object. Also if the `binding` param
   * is a function, it will be recognized and
   * returned.
   *
   * @method resolveFunc
   *
   * @param  {String}    binding
   *
   * @return {Object}
   */
  resolveFunc (binding) {
    if (typeof (binding) === 'function') {
      return { instance: null, isClosure: true, method: binding }
    }

    binding = this.translate(binding)
    const resolvedBinding = this.Ioc.makeFunc(binding)
    resolvedBinding.isClosure = false
    return resolvedBinding
  }
}

module.exports = Resolver
