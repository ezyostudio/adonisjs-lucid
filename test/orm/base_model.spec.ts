/*
 * @poppinss/data-models
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { DateTime } from 'luxon'
import { test } from '@japa/runner'
import lodash from '@poppinss/utils/lodash'
import { AppFactory } from '@adonisjs/core/factories/app'

import { ModelQueryBuilder } from '../../src/orm/query_builder/index.js'
import type { HasOne, HasMany, BelongsTo } from '../../src/types/relations.js'

import {
  column,
  hasMany,
  hasOne,
  belongsTo,
  beforeSave,
  beforeCreate,
  afterCreate,
  afterSave,
  afterUpdate,
  beforeUpdate,
  beforeDelete,
  afterDelete,
  beforeFetch,
  afterFetch,
  beforeFind,
  afterFind,
  afterPaginate,
  beforePaginate,
  computed,
} from '../../src/orm/decorators/index.js'

import {
  getDb,
  setup,
  mapToObj,
  getUsers,
  ormAdapter,
  resetTables,
  FakeAdapter,
  getBaseModel,
  sleep,
  cleanup as cleanupTables,
} from '../../test-helpers/index.js'
import { LucidRow } from '../../src/types/model.js'
import { ModelPaginator } from '../../src/orm/paginator/index.js'
import { SimplePaginator } from '../../src/database/paginator/simple_paginator.js'
import { SnakeCaseNamingStrategy } from '../../src/orm/naming_strategies/snake_case.js'
import * as errors from '../../src/errors.js'

test.group('Base model | boot', (group) => {
  group.setup(async () => {
    await setup()
  })

  group.teardown(async () => {
    await cleanupTables()
  })

  test('ensure save method is chainable', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    const adapter = new FakeAdapter()
    await app.init()

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column()
      declare username: string

      @column()
      declare age: number
    }

    User.$adapter = adapter

    const user = new User()
    user.username = 'virk'
    user.age = 22
    const chained = await user.save()

    assert.instanceOf(chained, User)
  })

  test('ensure fill method is chainable', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    const adapter = new FakeAdapter()
    await app.init()

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column()
      declare username: string

      @column()
      declare age: number
    }

    const user = new User()
    const chained = user.fill({
      username: 'virk',
      age: 22,
    })

    assert.instanceOf(chained, User)
  })

  test('ensure merge method is chainable', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    const adapter = new FakeAdapter()
    await app.init()

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column()
      declare username: string

      @column()
      declare age: number
    }

    const user = new User()
    const chained = user.merge({
      username: 'virk',
      age: 22,
    })

    assert.instanceOf(chained, User)
  })

  test('ensure refresh method is chainable', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    const adapter = new FakeAdapter()
    await app.init()

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column()
      declare username: string

      @column()
      declare age: number
    }
    User.$adapter = adapter

    const user = new User()
    const chained = await user.refresh()

    assert.instanceOf(chained, User)
  })

  test('compute table name from model name', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    const adapter = new FakeAdapter()
    await app.init()

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare username: string
    }

    User.boot()
    assert.equal(User.table, 'users')
  })

  test('allow overriding table name', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    const adapter = new FakeAdapter()
    await app.init()
    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      static table = 'my_users'

      @column({ isPrimary: true })
      declare id: number

      @column()
      declare username: string
    }

    User.boot()
    assert.equal(User.table, 'my_users')
  })

  test('initiate all required static properties', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    const adapter = new FakeAdapter()
    await app.init()
    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {}

    User.boot()
    assert.deepEqual(mapToObj(User.$columnsDefinitions), {})
    assert.deepEqual(mapToObj(User.$relationsDefinitions), {})
    assert.deepEqual(mapToObj(User.$computedDefinitions), {})
  })

  test('resolve column name from attribute name', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    const adapter = new FakeAdapter()
    await app.init()
    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      static $increments = false

      @column({ isPrimary: true })
      declare id: number

      @column()
      declare userName: string
    }

    User.boot()
    assert.deepEqual(User.$keys.attributesToColumns.get('userName'), 'user_name')
  })

  test('resolve serializeAs name from the attribute name', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    const adapter = new FakeAdapter()
    await app.init()
    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      static $increments = false

      @column({ isPrimary: true })
      declare id: number

      @column()
      declare userName: string
    }

    User.boot()
    assert.deepEqual(User.$keys.attributesToSerialized.get('userName'), 'userName')
  })

  test('resolve attribute name from column name', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    const adapter = new FakeAdapter()
    await app.init()
    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      static $increments = false

      @column({ isPrimary: true })
      declare id: number

      @column()
      declare userName: string
    }

    User.boot()
    assert.deepEqual(User.$keys.columnsToAttributes.get('user_name'), 'userName')
  })

  test('resolve serializeAs name from column name', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    const adapter = new FakeAdapter()
    await app.init()
    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      static $increments = false

      @column({ isPrimary: true })
      declare id: number

      @column()
      declare userName: string
    }

    User.boot()
    assert.deepEqual(User.$keys.columnsToSerialized.get('user_name'), 'userName')
  })

  test('resolve attribute name from serializeAs name', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    const adapter = new FakeAdapter()
    await app.init()
    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      static $increments = false

      @column({ isPrimary: true })
      declare id: number

      @column()
      declare userName: string
    }

    User.boot()
    assert.deepEqual(User.$keys.serializedToAttributes.get('userName'), 'userName')
  })

  test('resolve column name from serializeAs name', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    const adapter = new FakeAdapter()
    await app.init()
    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      static $increments = false

      @column({ isPrimary: true })
      declare id: number

      @column()
      declare userName: string
    }

    User.boot()
    assert.deepEqual(User.$keys.serializedToColumns.get('userName'), 'user_name')
  })
})

test.group('Base Model | options', (group) => {
  group.setup(async () => {
    await setup()
  })

  group.teardown(async () => {
    await cleanupTables()
  })

  test('set connection using useConnection method', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column()
      declare username: string
    }

    const user = new User()
    user.username = 'virk'

    user.useConnection('foo')
    assert.deepEqual(user.$options, { connection: 'foo' })
  })
})

test.group('Base Model | getter-setters', (group) => {
  group.setup(async () => {
    await setup()
  })

  group.teardown(async () => {
    await cleanupTables()
  })

  test('set property on $attributes when defined on model instance', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column()
      declare username: string
    }

    const user = new User()
    user.username = 'virk'

    assert.deepEqual(user.$attributes, { username: 'virk' })
  })

  test('pass value to setter when defined', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column()
      set username(value: any) {
        this.$setAttribute('username', value.toUpperCase())
      }
    }

    const user = new User()
    user.username = 'virk'

    assert.deepEqual(user.$attributes, { username: 'VIRK' })
  })

  test('set value on model instance when is not a column', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      declare username: string
    }
    User.boot()

    const user = new User()
    user.username = 'virk'

    assert.deepEqual(user.$attributes, {})
    assert.equal(user.username, 'virk')
  })

  test('get value from attributes', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column()
      declare username: string
    }

    const user = new User()
    user.$attributes = { username: 'virk' }

    assert.equal(user.username, 'virk')
  })

  test('rely on getter when column is defined as a getter', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column()
      get username() {
        return this.$getAttribute('username').toUpperCase()
      }
    }

    const user = new User()
    user.$attributes = { username: 'virk' }

    assert.equal(user.username, 'VIRK')
  })

  test('get value from model instance when is not a column', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      username = 'virk'
    }

    User.boot()
    const user = new User()
    assert.equal(user.username, 'virk')
  })

  test('get value for primary key', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare username: string
    }

    const user = new User()
    user.$attributes = { username: 'virk', id: 1 }

    assert.deepEqual(user.$primaryKeyValue, 1)
  })

  test('invoke getter when accessing value using primaryKeyValue', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ isPrimary: true })
      get id() {
        return String(this.$getAttribute('id'))
      }

      @column()
      declare username: string
    }

    const user = new User()
    user.$attributes = { username: 'virk', id: 1 }

    assert.deepEqual(user.$primaryKeyValue, '1')
  })

  test('invoke column serialize method when serializing model', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ isPrimary: true })
      get id() {
        return String(this.$getAttribute('id'))
      }

      @column({
        serialize(value) {
          return value.toUpperCase()
        },
      })
      declare username: string
    }

    const user = new User()
    user.$attributes = { username: 'virk', id: 1 }
    assert.equal(user.username, 'virk')
    assert.equal(user.toJSON().username, 'VIRK')
  })

  test('implement custom merge strategies using getters and setters', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column()
      get preferences(): object {
        return this.$getAttribute('preferences')
      }

      set preferences(value: object) {
        this.$setAttribute('preferences', lodash.merge(this.preferences, value))
      }
    }

    const user = new User()

    /**
     * Define and check property
     */
    user.preferences = {
      theme: 'dark',
    }
    assert.deepEqual(user.preferences, { theme: 'dark' })

    /**
     * Hydrate originals as if persisted
     */
    user.$hydrateOriginals()
    user.$isPersisted = true

    /**
     * Ensure $original is same as $attributes and nothing
     * is dirty
     */
    assert.deepEqual(user.$original, { preferences: { theme: 'dark' } })
    assert.deepEqual(user.$original, user.$attributes)
    assert.deepEqual(user.$dirty, {})

    user.merge({ preferences: { notifications: true } })
    assert.deepEqual(user.preferences, { theme: 'dark', notifications: true })

    assert.deepEqual(user.$dirty, { preferences: { theme: 'dark', notifications: true } })
  })
})

test.group('Base Model | dirty', (group) => {
  group.setup(async () => {
    await setup()
  })

  group.teardown(async () => {
    await cleanupTables()
  })

  test('get dirty properties on a fresh model', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column()
      declare username: string
    }

    const user = new User()
    user.username = 'virk'

    assert.deepEqual(user.$dirty, { username: 'virk' })
    assert.isTrue(user.$isDirty)
  })

  test('get empty object when model is not dirty', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column()
      declare username: string
    }

    const user = new User()
    user.$attributes = { username: 'virk' }
    user.$original = { username: 'virk' }

    user.$isPersisted = true

    assert.deepEqual(user.$dirty, {})
    assert.isFalse(user.$isDirty)
  })

  test('get empty object when model is not dirty with null values', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column()
      declare username: string
    }

    const user = new User()

    user.$attributes = { username: null }
    user.$original = { username: null }
    user.$isPersisted = true

    assert.deepEqual(user.$dirty, {})
    assert.isFalse(user.$isDirty)
  })

  test('get empty object when model is not dirty with false values', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column()
      declare username: string
    }

    const user = new User()

    user.$attributes = { username: false }
    user.$original = { username: false }
    user.$isPersisted = true

    assert.deepEqual(user.$dirty, {})
    assert.isFalse(user.$isDirty)
  })

  test('get values removed as a side-effect of fill as dirty', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const adapter = new FakeAdapter()

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column()
      declare username: string

      @column()
      declare age: number
    }

    User.$adapter = adapter

    const user = new User()
    user.username = 'virk'
    user.age = 22
    await user.save()

    assert.deepEqual(user.$dirty, {})
    assert.isFalse(user.$isDirty)
    assert.isTrue(user.$isPersisted)

    user.fill({ username: 'virk' })
    assert.deepEqual(user.$dirty, { age: null })
  })

  test('compute diff for properties represented as objects', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const adapter = new FakeAdapter()

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column()
      declare username: string

      @column()
      declare age: number

      @column()
      declare location: any
    }
    User.$adapter = adapter

    const user = new User()
    user.username = 'virk'
    user.location = { state: 'haryana', country: 'India' }
    await user.save()

    assert.deepEqual(user.$dirty, {})
    assert.isFalse(user.$isDirty)
    assert.isTrue(user.$isPersisted)

    user.location.state = 'goa'
    assert.deepEqual(user.$dirty, { location: { state: 'goa', country: 'India' } })
  })

  test('compute diff for properties represented as classes', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const adapter = new FakeAdapter()

    const BaseModel = getBaseModel(adapter)

    class Location {
      isDirty = false
      constructor(
        public state: string,
        public country: string
      ) {}
    }

    class User extends BaseModel {
      @column()
      declare username: string

      @column()
      declare age: number

      @column()
      location: any
    }
    User.$adapter = adapter

    const user = new User()
    user.username = 'virk'
    user.location = new Location('haryana', 'India')
    await user.save()

    assert.deepEqual(user.$dirty, {})
    assert.isFalse(user.$isDirty)
    assert.isTrue(user.$isPersisted)

    user.location.state = 'goa'
    user.location.isDirty = true
    assert.deepEqual(user.$dirty, { location: { state: 'goa', country: 'India', isDirty: true } })
  })

  test('isDirty returns whether field is dirty', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column()
      declare username: string

      @column()
      declare email: string
    }

    const user = new User()

    assert.isFalse(user.isDirty())
    assert.isFalse(user.isDirty('username'))

    user.username = 'virk'

    assert.isTrue(user.isDirty())
    assert.isTrue(user.isDirty('username'))
    assert.isFalse(user.isDirty('email'))
    assert.isTrue(user.isDirty(['username', 'email']))
  })
})

test.group('Base Model | persist', (group) => {
  group.setup(async () => {
    await setup()
  })

  group.teardown(async () => {
    await cleanupTables()
  })

  group.each.teardown(async () => {
    await resetTables()
  })

  test('persist model with the column name', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    const adapter = new FakeAdapter()
    await app.init()

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare username: string

      @column({ columnName: 'full_name' })
      declare fullName: string
    }

    User.$adapter = adapter
    adapter.on('insert', (model) => {
      model.$consumeAdapterResult({ id: 1 })
    })

    const user = new User()
    user.username = 'virk'
    user.fullName = 'H virk'

    await user.save()

    assert.isTrue(user.$isPersisted)
    assert.isFalse(user.$isDirty)
    assert.deepEqual(adapter.operations, [
      {
        type: 'insert',
        instance: user,
        attributes: { username: 'virk', full_name: 'H virk' },
      },
    ])

    assert.deepEqual(user.$attributes, { username: 'virk', fullName: 'H virk', id: 1 })
    assert.deepEqual(user.$original, { username: 'virk', fullName: 'H virk', id: 1 })
  })

  test('merge adapter insert return value with attributes', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    const adapter = new FakeAdapter()
    await app.init()

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column()
      declare username: string

      @column()
      declare id: number
    }

    User.$adapter = adapter
    adapter.on('insert', (model) => {
      model.$consumeAdapterResult({ id: 1 })
    })

    const user = new User()
    user.username = 'virk'

    await user.save()
    assert.isTrue(user.$isPersisted)
    assert.isFalse(user.$isDirty)
    assert.deepEqual(adapter.operations, [
      {
        type: 'insert',
        instance: user,
        attributes: { username: 'virk' },
      },
    ])

    assert.deepEqual(user.$attributes, { username: 'virk', id: 1 })
    assert.deepEqual(user.$original, { username: 'virk', id: 1 })
  })

  test('do not merge adapter results when not part of model columns', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    const adapter = new FakeAdapter()
    await app.init()

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column()
      declare username: string
    }

    User.$adapter = adapter
    adapter.on('insert', () => {
      return { id: 1 }
    })

    const user = new User()
    user.username = 'virk'

    await user.save()
    assert.isTrue(user.$isPersisted)
    assert.isFalse(user.$isDirty)
    assert.deepEqual(adapter.operations, [
      {
        type: 'insert',
        instance: user,
        attributes: { username: 'virk' },
      },
    ])

    assert.deepEqual(user.$attributes, { username: 'virk' })
    assert.deepEqual(user.$original, { username: 'virk' })
  })

  test('issue update when model has already been persisted', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    const adapter = new FakeAdapter()
    await app.init()

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column()
      declare username: string
    }

    User.$adapter = adapter

    const user = new User()
    user.username = 'virk'
    user.$isPersisted = true

    await user.save()
    assert.isTrue(user.$isPersisted)
    assert.isFalse(user.$isDirty)
    assert.deepEqual(adapter.operations, [
      {
        type: 'update',
        instance: user,
        attributes: { username: 'virk' },
      },
    ])

    assert.deepEqual(user.$attributes, { username: 'virk' })
    assert.deepEqual(user.$original, { username: 'virk' })
  })

  test('merge return values from update', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    const adapter = new FakeAdapter()
    await app.init()

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column()
      declare username: string

      @column({ columnName: 'updated_at' })
      declare updatedAt: string
    }

    adapter.on('update', (model) => {
      return model.$consumeAdapterResult({ updated_at: '2019-11-20' })
    })

    User.$adapter = adapter

    const user = new User()
    user.username = 'virk'
    user.$isPersisted = true

    await user.save()
    assert.isTrue(user.$isPersisted)
    assert.isFalse(user.$isDirty)
    assert.deepEqual(adapter.operations, [
      {
        type: 'update',
        instance: user,
        attributes: { username: 'virk' },
      },
    ])

    assert.deepEqual(user.$attributes, { username: 'virk', updatedAt: '2019-11-20' })
    assert.deepEqual(user.$original, { username: 'virk', updatedAt: '2019-11-20' })
  })

  test('the dirty should not contain DateTime field if DateTime value is same', async ({
    fs,
    assert,
  }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    const adapter = new FakeAdapter()
    await app.init()

    const BaseModel = getBaseModel(adapter)
    const currentTime = DateTime.now().toISO()!
    class User extends BaseModel {
      @column()
      declare username: string

      @column.dateTime({ columnName: 'updated_at' })
      declare updatedAt: DateTime
    }

    const user = new User()
    user.username = 'virk'
    user.updatedAt = DateTime.fromISO(currentTime)
    await user.save()

    assert.isTrue(user.$isPersisted)

    user.merge({ updatedAt: DateTime.fromISO(currentTime) })

    assert.isFalse(user.$isDirty)
    assert.deepEqual(user.$dirty, {})
  })

  test('do not issue update when model is not dirty', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    const adapter = new FakeAdapter()
    await app.init()

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column()
      declare username: string

      @column({ columnName: 'updated_at' })
      declare updatedAt: string
    }

    User.$adapter = adapter

    const user = new User()
    user.$isPersisted = true

    await user.save()
    assert.isTrue(user.$isPersisted)
    assert.isFalse(user.$isDirty)
    assert.deepEqual(adapter.operations, [])
    assert.deepEqual(user.$attributes, {})
    assert.deepEqual(user.$original, {})
  })

  test('refresh model instance', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare username: string

      @column()
      declare createdAt: string

      @column({ columnName: 'updated_at' })
      declare updatedAt: string
    }

    const user = new User()
    user.username = 'virk'
    await user.save()

    assert.isTrue(user.$isPersisted)
    assert.isFalse(user.$isDirty)
    assert.isUndefined(user.updatedAt)

    await user.refresh()
    assert.isTrue(user.$isPersisted)
    assert.isFalse(user.$isDirty)
    assert.isDefined(user.updatedAt)
  })

  test('refresh model instance inside a transaction', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare username: string

      @column()
      declare createdAt: string

      @column({ columnName: 'updated_at' })
      declare updatedAt: string
    }

    /**
     * Create user
     */
    const user = new User()
    user.username = 'virk'
    await user.save()

    /**
     * Update inside transaction
     */
    const trx = await db.transaction()
    user.useTransaction(trx)
    user.username = 'romain'
    await user.save()
    assert.equal(user.username, 'romain')

    /**
     * Refresh inside transaction
     */
    await user.refresh()
    assert.equal(user.username, 'romain')

    /**
     * Refresh outside transaction
     */
    await trx.rollback()
    await user.refresh()
    assert.equal(user.username, 'virk')
  })

  test('raise exception when attempted to refresh deleted row', async ({ fs, assert }) => {
    assert.plan(4)

    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare username: string

      @column()
      declare createdAt: string

      @column({ columnName: 'updated_at' })
      declare updatedAt: string
    }

    const user = new User()
    user.username = 'virk'
    await user.save()

    assert.isTrue(user.$isPersisted)
    assert.isFalse(user.$isDirty)
    assert.isUndefined(user.updatedAt)

    await db.from('users').del()

    try {
      await user.refresh()
    } catch ({ message }) {
      assert.equal(message, '"Model.refresh" failed. Unable to lookup "users" table where "id" = 1')
    }
  })

  test('invoke column prepare method before passing values to the adapter', async ({
    fs,
    assert,
  }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const adapter = new FakeAdapter()
    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column()
      declare username: string

      @column({ columnName: 'full_name', prepare: (value) => value.toUpperCase() })
      declare fullName: string
    }

    User.$adapter = adapter

    const user = new User()
    user.username = 'virk'
    user.fullName = 'H virk'

    await user.save()
    assert.isTrue(user.$isPersisted)
    assert.isFalse(user.$isDirty)
    assert.deepEqual(adapter.operations, [
      {
        type: 'insert',
        instance: user,
        attributes: { username: 'virk', full_name: 'H VIRK' },
      },
    ])

    assert.deepEqual(user.$attributes, { username: 'virk', fullName: 'H virk' })
    assert.deepEqual(user.$original, { username: 'virk', fullName: 'H virk' })
  })

  test('send values mutated by the hooks to the adapter', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const adapter = new FakeAdapter()

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare username: string

      @column({ columnName: 'full_name' })
      declare fullName: string

      @beforeUpdate()
      static touchValues(model: User) {
        model.fullName = 'Foo'
      }
    }

    User.$adapter = adapter
    adapter.on('update', (_, attributes) => {
      assert.deepEqual(attributes, { full_name: 'Foo' })
    })

    const user = new User()
    user.$isPersisted = true
    await user.save()

    assert.deepEqual(user.$attributes, { fullName: 'Foo' })
    assert.deepEqual(user.$original, { fullName: 'Foo' })
  })

  test('allow datetime column value to be null', async ({ fs, assert }) => {
    assert.plan(3)

    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const adapter = new FakeAdapter()

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare username: string

      @column()
      declare createdAt: DateTime | null
    }

    User.$adapter = adapter
    adapter.on('update', (_, attributes) => {
      assert.deepEqual(attributes, { created_at: null })
    })

    const user = new User()
    await user.save()

    user.createdAt = null
    await user.save()

    assert.deepEqual(user.$attributes, { createdAt: null })
    assert.deepEqual(user.$original, { createdAt: null })
  })

  test('assign local id to the model', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = await getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      static table = 'uuid_users'
      static selfAssignPrimaryKey = true

      @column({ isPrimary: true })
      declare id: string

      @column()
      declare username: string

      @column()
      declare createdAt: string

      @column({ columnName: 'updated_at' })
      declare updatedAt: string
    }

    User.boot()

    const uuid = '2da96a33-57a0-4752-9d56-0e2485d4d2a4'

    const user = new User()
    user.id = uuid
    user.username = 'virk'
    await user.save()

    assert.isTrue(user.$isPersisted)
    assert.isFalse(user.$isDirty)
    assert.isUndefined(user.updatedAt)
    assert.equal(user.id, uuid)

    await user.refresh()
    assert.isTrue(user.$isPersisted)
    assert.isFalse(user.$isDirty)
    assert.isDefined(user.updatedAt)
    assert.equal(user.id.toLocaleLowerCase(), uuid)
  })

  test('perform update query when local primary key is updated', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = await getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      static table = 'uuid_users'
      static selfAssignPrimaryKey = true

      @column({ isPrimary: true })
      declare id: string

      @column()
      declare username: string

      @column()
      declare createdAt: string

      @column({ columnName: 'updated_at' })
      declare updatedAt: string
    }

    User.boot()

    const uuid = '2da96a33-57a0-4752-9d56-0e2485d4d2a4'

    const user = new User()
    user.id = uuid
    user.username = 'virk'
    await user.save()

    const newUuid = '4da96a33-57a0-4752-9d56-0e2485d4d2a1'
    user.id = newUuid

    await user.save()
    const users = await User.all()
    assert.lengthOf(users, 1)
    assert.equal(users[0].id.toLowerCase(), newUuid)
  })

  test('use custom name for the local primary key', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = await getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      static table = 'uuid_users'
      static selfAssignPrimaryKey = true

      @column({ isPrimary: true, columnName: 'id' })
      declare userId: string

      @column()
      declare username: string

      @column()
      declare createdAt: string

      @column({ columnName: 'updated_at' })
      declare updatedAt: string
    }

    User.boot()

    const uuid = '2da96a33-57a0-4752-9d56-0e2485d4d2a4'

    const user = new User()
    user.userId = uuid
    user.username = 'virk'
    await user.save()

    const newUuid = '4da96a33-57a0-4752-9d56-0e2485d4d2a1'
    user.userId = newUuid

    await user.save()
    const users = await User.all()
    assert.lengthOf(users, 1)
    assert.equal(users[0].userId.toLowerCase(), newUuid)
  })
})

test.group('Self assign primary key', () => {
  test('send primary value during insert to the adapter', async ({ fs, assert }) => {
    assert.plan(1)

    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const adapter = new FakeAdapter()

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      static selfAssignPrimaryKey = true

      @column({ isPrimary: true })
      declare id: string

      @column()
      declare username: string

      @column({ columnName: 'full_name' })
      declare fullName: string
    }

    User.$adapter = adapter
    adapter.on('insert', (_, attributes) => {
      assert.deepEqual(attributes, {
        id: '12345',
        username: 'virk',
        full_name: 'H virk',
      })
    })

    const user = new User()
    user.id = '12345'
    user.username = 'virk'
    user.fullName = 'H virk'

    await user.save()
  })

  test('update primary key when changed', async ({ fs, assert }) => {
    assert.plan(3)

    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const adapter = new FakeAdapter()

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      static selfAssignPrimaryKey = true

      @column({ isPrimary: true })
      declare id: string

      @column()
      declare username: string

      @column({ columnName: 'full_name' })
      declare fullName: string
    }

    User.$adapter = adapter
    adapter.on('insert', (_, attributes) => {
      assert.deepEqual(attributes, {
        id: '12345',
        username: 'virk',
        full_name: 'H virk',
      })
    })
    adapter.on('update', (_, dirty) => {
      assert.deepEqual(dirty, {
        id: '3456',
      })
    })

    const user = new User()
    user.id = '12345'
    user.username = 'virk'
    user.fullName = 'H virk'

    await user.save()
    user.id = '3456'

    await user.save()
    assert.isFalse(user.$isDirty)
  })
})

test.group('Base Model | create from adapter results', (group) => {
  group.setup(async () => {
    await setup()
  })

  group.teardown(async () => {
    await cleanupTables()
  })

  test('create model instance using $createFromAdapterResult method', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const adapter = new FakeAdapter()

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column()
      declare username: string

      @column({ columnName: 'full_name' })
      declare fullName: string
    }

    const user = User.$createFromAdapterResult({ username: 'virk' })
    user!.username = 'virk'

    assert.isTrue(user!.$isPersisted)
    assert.isFalse(user!.$isDirty)
    assert.isFalse(user!.$isLocal)
    assert.deepEqual(user!.$attributes, { username: 'virk' })
    assert.deepEqual(user!.$original, { username: 'virk' })
  })

  test('set options on model instance passed to $createFromAdapterResult', async ({
    fs,
    assert,
  }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const adapter = new FakeAdapter()

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column()
      declare username: string

      @column({ columnName: 'full_name' })
      declare fullName: string
    }

    const user = User.$createFromAdapterResult({ username: 'virk' }, [], { connection: 'foo' })

    assert.deepEqual(user!.$options, { connection: 'foo' })
    assert.isTrue(user!.$isPersisted)
    assert.isFalse(user!.$isDirty)
    assert.isFalse(user!.$isLocal)
    assert.deepEqual(user!.$attributes, { username: 'virk' })
    assert.deepEqual(user!.$original, { username: 'virk' })
  })

  test('return null from $createFromAdapterResult when input is not object', async ({
    fs,
    assert,
  }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const adapter = new FakeAdapter()

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column()
      declare username: string

      @column({ columnName: 'full_name' })
      declare fullName: string
    }

    const user = User.$createFromAdapterResult([])
    assert.isNull(user)
  })

  test('create multiple model instance using $createMultipleFromAdapterResult', async ({
    assert,
    fs,
  }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const adapter = new FakeAdapter()

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column()
      declare username: string

      @column({ columnName: 'full_name' })
      declare fullName: string
    }

    const users = User.$createMultipleFromAdapterResult([
      { username: 'virk', full_name: 'H virk' },
      { username: 'prasan' },
    ])
    assert.lengthOf(users, 2)

    assert.isTrue(users[0].$isPersisted)
    assert.isFalse(users[0].$isDirty)
    assert.isFalse(users[0].$isLocal)
    assert.deepEqual(users[0].$attributes, { username: 'virk', fullName: 'H virk' })
    assert.deepEqual(users[0].$original, { username: 'virk', fullName: 'H virk' })

    assert.isTrue(users[1].$isPersisted)
    assert.isFalse(users[1].$isDirty)
    assert.isFalse(users[1].$isLocal)
    assert.deepEqual(users[1].$attributes, { username: 'prasan' })
    assert.deepEqual(users[1].$original, { username: 'prasan' })
  })

  test('pass model options via $createMultipleFromAdapterResult', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const adapter = new FakeAdapter()

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column()
      declare username: string

      @column({ columnName: 'full_name' })
      declare fullName: string
    }

    const users = User.$createMultipleFromAdapterResult(
      [{ username: 'virk', full_name: 'H virk' }, { username: 'prasan' }],
      [],
      { connection: 'foo' }
    )

    assert.lengthOf(users, 2)

    assert.isTrue(users[0].$isPersisted)
    assert.isFalse(users[0].$isDirty)
    assert.isFalse(users[0].$isLocal)
    assert.deepEqual(users[0].$options, { connection: 'foo' })
    assert.deepEqual(users[0].$attributes, { username: 'virk', fullName: 'H virk' })
    assert.deepEqual(users[0].$original, { username: 'virk', fullName: 'H virk' })

    assert.isTrue(users[1].$isPersisted)
    assert.isFalse(users[1].$isDirty)
    assert.isFalse(users[1].$isLocal)
    assert.deepEqual(users[1].$options, { connection: 'foo' })
    assert.deepEqual(users[1].$attributes, { username: 'prasan' })
    assert.deepEqual(users[1].$original, { username: 'prasan' })
  })

  test('skip rows that are not valid objects inside array', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const adapter = new FakeAdapter()

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column()
      declare username: string

      @column({ columnName: 'full_name' })
      declare fullName: string
    }

    const users = User.$createMultipleFromAdapterResult([
      { username: 'virk', full_name: 'H virk' },
      null as any,
    ])
    assert.lengthOf(users, 1)

    assert.isTrue(users[0].$isPersisted)
    assert.isFalse(users[0].$isDirty)
    assert.isFalse(users[0].$isLocal)
    assert.deepEqual(users[0].$attributes, { username: 'virk', fullName: 'H virk' })
    assert.deepEqual(users[0].$original, { username: 'virk', fullName: 'H virk' })
  })

  test('invoke column consume method', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const adapter = new FakeAdapter()

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column()
      declare username: string

      @column({
        consume: (value) => value.toUpperCase(),
      })
      declare fullName: string
    }

    const user = User.$createFromAdapterResult({ full_name: 'virk' })

    assert.isTrue(user!.$isPersisted)
    assert.isFalse(user!.$isDirty)
    assert.isFalse(user!.$isLocal)
    assert.deepEqual(user!.$attributes, { fullName: 'VIRK' })
    assert.deepEqual(user!.$original, { fullName: 'VIRK' })
  })

  test('original and attributes should not be shared', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const adapter = new FakeAdapter()

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column()
      declare user: {
        username: string
      }

      @column({ columnName: 'full_name' })
      declare fullName: string
    }

    const user = User.$createFromAdapterResult({
      user: {
        username: 'virk',
      },
    })

    user!.user.username = 'nikk'
    assert.isTrue(user!.$isDirty)
    assert.deepEqual(user!.$dirty, { user: { username: 'nikk' } })
  })
})

test.group('Base Model | delete', (group) => {
  group.setup(async () => {
    await setup()
  })

  group.teardown(async () => {
    await cleanupTables()
  })

  test('delete model instance using adapter', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const adapter = new FakeAdapter()

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column()
      declare username: string
    }

    User.$adapter = adapter

    const user = new User()
    await user.delete()
    assert.deepEqual(adapter.operations, [
      {
        type: 'delete',
        instance: user,
      },
    ])

    assert.isTrue(user.$isDeleted)
  })

  test('raise exception when trying to mutate model after deletion', async ({ fs, assert }) => {
    assert.plan(1)

    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const adapter = new FakeAdapter()

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column()
      declare username: string
    }

    User.$adapter = adapter

    const user = new User()
    await user.delete()

    try {
      user.username = 'virk'
    } catch ({ message }) {
      assert.equal(message, 'Cannot mutate delete model instance')
    }
  })
})

test.group('Base Model | serializeAttributes', () => {
  test('serialize attributes', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const adapter = new FakeAdapter()

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column()
      declare username: string
    }

    const user = new User()
    user.username = 'virk'

    assert.deepEqual(user.serializeAttributes(), { username: 'virk' })
  })

  test('invoke custom serialize method when serializing attributes', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const adapter = new FakeAdapter()

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ serialize: (value) => value.toUpperCase() })
      declare username: string
    }

    const user = new User()
    user.username = 'virk'

    assert.deepEqual(user.serializeAttributes(), { username: 'VIRK' })
  })

  test('use custom serializeAs key', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const adapter = new FakeAdapter()

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ serializeAs: 'uname' })
      declare username: string
    }

    const user = new User()
    user.username = 'virk'

    assert.deepEqual(user.serializeAttributes(), { uname: 'virk' })
  })

  test('do not serialize when serializeAs key is null', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const adapter = new FakeAdapter()

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ serializeAs: null })
      declare username: string
    }

    const user = new User()
    user.username = 'virk'

    assert.deepEqual(user.serializeAttributes(), {})
  })

  test('pick fields during serialization', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const adapter = new FakeAdapter()

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column()
      declare username: string

      @column()
      declare id: string
    }

    const user = new User()
    user.username = 'virk'
    user.id = '1'

    assert.deepEqual(user.serializeAttributes(['id']), { id: '1' })
  })

  test('ignore fields under omit', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const adapter = new FakeAdapter()

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column()
      declare username: string

      @column()
      declare id: string
    }

    const user = new User()
    user.username = 'virk'
    user.id = '1'

    assert.deepEqual(
      user.serializeAttributes({
        omit: ['username'],
      }),
      { id: '1' }
    )
  })

  test('use omit and pick together', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const adapter = new FakeAdapter()

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column()
      declare username: string

      @column()
      declare id: string
    }

    const user = new User()
    user.username = 'virk'
    user.id = '1'

    assert.deepEqual(
      user.serializeAttributes({
        pick: ['id', 'username'],
        omit: ['username'],
      }),
      { id: '1' }
    )
  })

  test('ignore fields that has serializeAs = null, even when part of pick array', async ({
    assert,
    fs,
  }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const adapter = new FakeAdapter()

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column()
      declare username: string

      @column({ serializeAs: null })
      declare id: string
    }

    const user = new User()
    user.username = 'virk'
    user.id = '1'

    assert.deepEqual(user.serializeAttributes(['id']), {})
  })

  test('do not invoke custom serialize method when raw flag is on', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const adapter = new FakeAdapter()

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ serialize: (value) => value.toUpperCase() })
      declare username: string
    }

    const user = new User()
    user.username = 'virk'

    assert.deepEqual(user.serializeAttributes(undefined, true), { username: 'virk' })
  })

  test('use custom serializeAs key when raw flag is on', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const adapter = new FakeAdapter()

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ serializeAs: 'uname' })
      declare username: string
    }

    const user = new User()
    user.username = 'virk'

    assert.deepEqual(user.serializeAttributes(undefined, true), { uname: 'virk' })
  })

  test('do not serialize with serializeAs = null, when raw flag is on', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const adapter = new FakeAdapter()

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ serializeAs: null })
      declare username: string
    }

    const user = new User()
    user.username = 'virk'

    assert.deepEqual(user.serializeAttributes(undefined, true), {})
  })

  test('cherry pick fields in raw mode', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const adapter = new FakeAdapter()

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column()
      declare username: string

      @column()
      declare id: string
    }

    const user = new User()
    user.username = 'virk'
    user.id = '1'

    assert.deepEqual(user.serializeAttributes(['id'], true), { id: '1' })
  })

  test('ignore fields under omit array in raw mode', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const adapter = new FakeAdapter()

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column()
      declare username: string

      @column()
      declare id: string
    }

    const user = new User()
    user.username = 'virk'
    user.id = '1'

    assert.deepEqual(
      user.serializeAttributes(
        {
          pick: ['id', 'username'],
          omit: ['username'],
        },
        true
      ),
      { id: '1' }
    )
  })
})

test.group('Base Model | serializeRelations', () => {
  test('serialize relations', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const adapter = new FakeAdapter()

    const BaseModel = getBaseModel(adapter)

    class Profile extends BaseModel {
      @column()
      declare username: string

      @column()
      declare userId: number
    }

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @hasOne(() => Profile)
      declare profile: HasOne<typeof Profile>
    }

    const user = new User()
    const profile = new Profile()
    profile.username = 'virk'
    profile.userId = 1

    user.$setRelated('profile', profile)
    assert.deepEqual(user.serializeRelations(), {
      profile: {
        username: 'virk',
        userId: 1,
      },
    })
  })

  test('use custom serializeAs key when raw flag is on', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const adapter = new FakeAdapter()

    const BaseModel = getBaseModel(adapter)

    class Profile extends BaseModel {
      @column()
      declare username: string

      @column()
      declare userId: number
    }

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @hasOne(() => Profile, { serializeAs: 'userProfile' })
      declare profile: HasOne<typeof Profile>
    }

    const user = new User()
    const profile = new Profile()
    profile.username = 'virk'
    profile.userId = 1

    user.$setRelated('profile', profile)
    assert.deepEqual(user.serializeRelations(), {
      userProfile: {
        username: 'virk',
        userId: 1,
      },
    })
  })

  test('do not serialize relations when serializeAs is null', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const adapter = new FakeAdapter()

    const BaseModel = getBaseModel(adapter)

    class Profile extends BaseModel {
      @column()
      declare username: string

      @column()
      declare userId: number
    }

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @hasOne(() => Profile, { serializeAs: null })
      declare profile: HasOne<typeof Profile>
    }

    const user = new User()
    const profile = new Profile()
    profile.username = 'virk'
    profile.userId = 1

    user.$setRelated('profile', profile)
    assert.deepEqual(user.serializeRelations(), {})
  })

  test('do not recursively serialize relations when raw is true', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const adapter = new FakeAdapter()

    const BaseModel = getBaseModel(adapter)

    class Profile extends BaseModel {
      @column()
      declare username: string

      @column()
      declare userId: number
    }

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @hasOne(() => Profile)
      declare profile: HasOne<typeof Profile>
    }

    const user = new User()
    const profile = new Profile()
    profile.username = 'virk'
    profile.userId = 1

    user.$setRelated('profile', profile)
    assert.deepEqual(user.serializeRelations(undefined, true), {
      profile: profile,
    })
  })

  test('use custom serializeAs key when raw flag is on', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const adapter = new FakeAdapter()

    const BaseModel = getBaseModel(adapter)

    class Profile extends BaseModel {
      @column()
      declare username: string

      @column()
      declare userId: number
    }

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @hasOne(() => Profile, { serializeAs: 'userProfile' })
      declare profile: HasOne<typeof Profile>
    }

    const user = new User()
    const profile = new Profile()
    profile.username = 'virk'
    profile.userId = 1

    user.$setRelated('profile', profile)
    assert.deepEqual(user.serializeRelations(undefined, true), {
      userProfile: profile,
    })
  })

  test('do not serialize relations with serializeAs is null when raw flag is on', async ({
    assert,
    fs,
  }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const adapter = new FakeAdapter()

    const BaseModel = getBaseModel(adapter)

    class Profile extends BaseModel {
      @column()
      declare username: string

      @column()
      declare userId: number
    }

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @hasOne(() => Profile, { serializeAs: null })
      declare profile: HasOne<typeof Profile>
    }

    const user = new User()
    const profile = new Profile()
    profile.username = 'virk'
    profile.userId = 1

    user.$setRelated('profile', profile)
    assert.deepEqual(user.serializeRelations(undefined, true), {})
  })

  test('cherry pick relationship fields', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const adapter = new FakeAdapter()

    const BaseModel = getBaseModel(adapter)

    class Profile extends BaseModel {
      @column()
      declare username: string

      @column()
      declare userId: number
    }

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @hasOne(() => Profile)
      declare profile: HasOne<typeof Profile>
    }

    const user = new User()
    const profile = new Profile()
    profile.username = 'virk'
    profile.userId = 1

    user.$setRelated('profile', profile)
    assert.deepEqual(
      user.serializeRelations({
        profile: {
          fields: ['userId'],
        },
      }),
      {
        profile: {
          userId: 1,
        },
      }
    )
  })

  test('select all fields when no custom fields are defined for a relationship', async ({
    fs,
    assert,
  }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const adapter = new FakeAdapter()

    const BaseModel = getBaseModel(adapter)

    class Profile extends BaseModel {
      @column()
      declare username: string

      @column()
      declare userId: number
    }

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @hasOne(() => Profile)
      declare profile: HasOne<typeof Profile>
    }

    const user = new User()
    const profile = new Profile()
    profile.username = 'virk'
    profile.userId = 1

    user.$setRelated('profile', profile)
    assert.deepEqual(
      user.serializeRelations({
        profile: {},
      }),
      {
        profile: {
          userId: 1,
          username: 'virk',
        },
      }
    )
  })

  test('do not select any fields when relationship fields is an empty array', async ({
    assert,
    fs,
  }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const adapter = new FakeAdapter()

    const BaseModel = getBaseModel(adapter)

    class Profile extends BaseModel {
      @column()
      declare username: string

      @column()
      declare userId: number
    }

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @hasOne(() => Profile)
      declare profile: HasOne<typeof Profile>
    }

    const user = new User()
    const profile = new Profile()
    profile.username = 'virk'
    profile.userId = 1

    user.$setRelated('profile', profile)
    assert.deepEqual(
      user.serializeRelations({
        profile: {
          fields: [],
        },
      }),
      {
        profile: {},
      }
    )
  })
})

test.group('Base Model | toJSON', (group) => {
  group.setup(async () => {
    await setup()
  })

  group.teardown(async () => {
    await cleanupTables()
  })

  test('convert model to its JSON representation', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const adapter = new FakeAdapter()

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column()
      declare username: string
    }

    const user = new User()
    user.username = 'virk'

    assert.deepEqual(user.toJSON(), { username: 'virk' })
  })

  test('use serializeAs key when converting model to JSON', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const adapter = new FakeAdapter()

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ serializeAs: 'theUsername' })
      declare username: string
    }

    const user = new User()
    user.username = 'virk'

    assert.deepEqual(user.toJSON(), { theUsername: 'virk' })
  })

  test('do not serialize when serializeAs is set to null', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const adapter = new FakeAdapter()

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ serializeAs: null })
      declare username: string
    }

    const user = new User()
    user.username = 'virk'

    assert.deepEqual(user.toJSON(), {})
  })

  test('add computed properties to toJSON result', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const adapter = new FakeAdapter()

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column()
      declare username: string

      @computed()
      get fullName() {
        return this.username.toUpperCase()
      }
    }

    const user = new User()
    user.username = 'virk'

    assert.deepEqual(user.toJSON(), { username: 'virk', fullName: 'VIRK' })
  })

  test('do not add computed property when it returns undefined', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const adapter = new FakeAdapter()

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column()
      declare username: string

      @computed()
      get fullName() {
        return undefined
      }
    }

    const user = new User()
    user.username = 'virk'

    assert.deepEqual(user.toJSON(), { username: 'virk' })
  })

  test('cherry pick keys during serialization', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const adapter = new FakeAdapter()

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column()
      declare username: string

      @computed()
      get fullName() {
        return this.username.toUpperCase()
      }
    }

    const user = new User()
    user.username = 'virk'

    assert.deepEqual(
      user.serialize({
        fields: ['username'],
      }),
      { username: 'virk' }
    )
  })

  test('serialize extras', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const adapter = new FakeAdapter()

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      serializeExtras = true

      @column()
      declare username: string

      @computed()
      get fullName() {
        return this.username.toUpperCase()
      }
    }

    const user = new User()
    user.username = 'virk'
    user.$extras = { postsCount: 10 }

    assert.deepEqual(user.toJSON(), {
      username: 'virk',
      fullName: 'VIRK',
      meta: {
        postsCount: 10,
      },
    })
  })

  test('define serialize extras as a function', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const adapter = new FakeAdapter()

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      serializeExtras() {
        return {
          posts: {
            count: this.$extras.postsCount,
          },
        }
      }

      @column()
      declare username: string

      @computed()
      get fullName() {
        return this.username.toUpperCase()
      }
    }

    const user = new User()
    user.username = 'virk'
    user.$extras = { postsCount: 10 }

    assert.deepEqual(user.toJSON(), {
      username: 'virk',
      fullName: 'VIRK',
      posts: {
        count: 10,
      },
    })
  })

  test('do not serialize undefined values', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const adapter = new FakeAdapter()

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column()
      declare username: string

      @column()
      declare age: number
    }

    const user = new User()
    user.username = 'virk'

    assert.deepEqual(user.toJSON(), { username: 'virk' })
  })

  test('serialize null values', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const adapter = new FakeAdapter()

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column()
      declare username: string

      @column()
      declare age: number | null
    }

    const user = new User()
    user.username = 'virk'
    user.age = null

    assert.deepEqual(user.toJSON(), { username: 'virk', age: null })
  })
})

test.group('BaseModel | cache', (group) => {
  group.setup(async () => {
    await setup()
  })

  group.teardown(async () => {
    await cleanupTables()
  })

  test('cache getter value', async ({ fs, assert }) => {
    let invokedCounter = 0
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const adapter = new FakeAdapter()

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column()
      get username() {
        return this.$getAttributeFromCache('username', (value) => {
          invokedCounter++
          return value.toUpperCase()
        })
      }
    }

    const user = new User()
    user.$attributes = { username: 'virk' }

    assert.equal(user.username, 'VIRK')
    assert.equal(user.username, 'VIRK')
    assert.equal(user.username, 'VIRK')
    assert.equal(user.username, 'VIRK')
    assert.equal(user.username, 'VIRK')
    assert.equal(invokedCounter, 1)
  })

  test('re-call getter function when attribute value changes', async ({ fs, assert }) => {
    let invokedCounter = 0
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const adapter = new FakeAdapter()

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column()
      get username() {
        return this.$getAttributeFromCache('username', (value) => {
          invokedCounter++
          return value.toUpperCase()
        })
      }
    }

    const user = new User()
    user.$attributes = { username: 'virk' }

    assert.equal(user.username, 'VIRK')

    user.$attributes.username = 'Prasanjit'
    assert.equal(user.username, 'PRASANJIT')
    assert.equal(user.username, 'PRASANJIT')
    assert.equal(user.username, 'PRASANJIT')
    assert.equal(user.username, 'PRASANJIT')

    assert.equal(invokedCounter, 2)
  })
})

test.group('BaseModel | fill/merge', (group) => {
  group.setup(async () => {
    await setup()
  })

  group.teardown(async () => {
    await cleanupTables()
  })

  test('fill model instance with bulk attributes', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const adapter = new FakeAdapter()

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column()
      declare username: string
    }

    const user = new User()
    user.fill({ username: 'virk' })
    assert.deepEqual(user.$attributes, { username: 'virk' })
  })

  test('raise error when extra properties are defined', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const adapter = new FakeAdapter()

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column()
      declare username: string
    }

    const user = new User()
    const fn = () => user.fill({ username: 'virk', isAdmin: true } as any)
    assert.throws(
      fn,
      'Cannot define "isAdmin" on "User" model, since it is not defined as a model property'
    )
  })

  test('set extra properties via fill when allowExtraProperties is true', async ({
    fs,
    assert,
  }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const adapter = new FakeAdapter()

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column()
      declare username: string
    }

    const user = new User()
    user.fill({ username: 'virk', isAdmin: true } as any, true)
    assert.deepEqual(user.$attributes, { username: 'virk' })
    assert.deepEqual(user.$extras, { isAdmin: true })
  })

  test('overwrite existing values when using fill', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const adapter = new FakeAdapter()

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column()
      declare username: string

      @column()
      declare age: number
    }

    const user = new User()
    user.age = 22

    assert.deepEqual(user.$attributes, { age: 22 })
    user.fill({ username: 'virk' })
    assert.deepEqual(user.$attributes, { username: 'virk' })
  })

  test('merge to existing when using merge instead of fill', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const adapter = new FakeAdapter()

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column()
      declare username: string

      @column()
      declare age: number
    }

    const user = new User()
    user.age = 22

    assert.deepEqual(user.$attributes, { age: 22 })
    user.merge({ username: 'virk' })
    assert.deepEqual(user.$attributes, { username: 'virk', age: 22 })
  })

  test('set properties with explicit undefined values', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const adapter = new FakeAdapter()

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column()
      declare username: string

      @column()
      declare age: number
    }

    const user = new User()
    user.age = 22

    assert.deepEqual(user.$attributes, { age: 22 })
    user.merge({ username: 'virk', age: undefined })
    assert.deepEqual(user.$attributes, { username: 'virk', age: undefined })
  })

  test('invoke setter when using fill', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const adapter = new FakeAdapter()

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column()
      declare username: string

      @column()
      get age(): number {
        return this.$getAttribute('age')
      }

      set age(age: number) {
        this.$setAttribute('age', age + 1)
      }
    }

    const user = new User()
    user.age = 22

    assert.deepEqual(user.$attributes, { age: 23 })
    user.fill({ username: 'virk', age: 22 })
    assert.deepEqual(user.$attributes, { username: 'virk', age: 23 })
  })

  test('fill using the column name', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const adapter = new FakeAdapter()

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column()
      declare firstName: string
    }

    const user = new User()
    user.fill({ first_name: 'virk' } as any)
    assert.deepEqual(user.$attributes, { firstName: 'virk' })
  })

  test('invoke setter during fill when using column name', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const adapter = new FakeAdapter()

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column()
      declare username: string

      @column({ columnName: 'user_age' })
      get age(): number {
        return this.$getAttribute('age')
      }

      set age(age: number) {
        this.$setAttribute('age', age + 1)
      }
    }

    const user = new User()
    user.fill({ user_age: 22 } as any)
    assert.deepEqual(user.$attributes, { age: 23 })
  })

  test('merge set non-column model properties', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const adapter = new FakeAdapter()

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column()
      declare username: string

      @column()
      declare age: number

      foo!: string
    }

    const user = new User()
    user.age = 22

    assert.deepEqual(user.$attributes, { age: 22 })
    user.merge({ username: 'virk', foo: 'bar' })
    assert.deepEqual(user.$attributes, { username: 'virk', age: 22 })
    assert.equal(user.foo, 'bar')
  })

  test('merge set non-column model properties with inheritance', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const adapter = new FakeAdapter()

    const BaseModel = getBaseModel(adapter)

    class Super extends BaseModel {
      foo!: string
    }

    class User extends Super {
      @column()
      declare username: string

      @column()
      declare age: number
    }

    const user = new User()
    user.age = 22

    assert.deepEqual(user.$attributes, { age: 22 })
    user.merge({ username: 'virk', foo: 'bar' })
    assert.deepEqual(user.$attributes, { username: 'virk', age: 22 })
    assert.equal(user.foo, 'bar')
  })
})

test.group('Base | apdater', (group) => {
  group.setup(async () => {
    await setup()
  })

  group.teardown(async () => {
    await cleanupTables()
  })

  test('pass model instance with attributes to the adapter insert method', async ({
    fs,
    assert,
  }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const adapter = new FakeAdapter()

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column()
      declare username: string
    }

    User.$adapter = adapter
    const user = new User()
    user.username = 'virk'

    await user.save()

    assert.deepEqual(adapter.operations, [
      {
        type: 'insert',
        instance: user,
        attributes: { username: 'virk' },
      },
    ])
  })

  test('pass model instance with attributes to the adapter update method', async ({
    fs,
    assert,
  }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const adapter = new FakeAdapter()

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column()
      declare username: string
    }

    User.$adapter = adapter
    const user = new User()
    user.username = 'virk'

    await user.save()

    user.username = 'nikk'
    await user.save()

    assert.deepEqual(adapter.operations, [
      {
        type: 'insert',
        instance: user,
        attributes: { username: 'virk' },
      },
      {
        type: 'update',
        instance: user,
        attributes: { username: 'nikk' },
      },
    ])
  })

  test('pass model instance to the adapter delete method', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const adapter = new FakeAdapter()

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column()
      declare username: string
    }

    User.$adapter = adapter
    const user = new User()
    user.username = 'virk'

    await user.save()
    await user.delete()

    assert.deepEqual(adapter.operations, [
      {
        type: 'insert',
        instance: user,
        attributes: { username: 'virk' },
      },
      {
        type: 'delete',
        instance: user,
      },
    ])
  })

  test('fill model instance with bulk attributes via column name is different', async ({
    assert,
    fs,
  }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const adapter = new FakeAdapter()

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ columnName: 'first_name' })
      declare firstName: string
    }

    User.$adapter = adapter

    const user = new User()
    user.fill({ firstName: 'virk' })
    await user.save()

    assert.deepEqual(adapter.operations, [
      {
        type: 'insert',
        instance: user,
        attributes: { first_name: 'virk' },
      },
    ])
  })
})

test.group('Base Model | sideloaded', (group) => {
  group.setup(async () => {
    await setup()
  })

  group.teardown(async () => {
    await cleanupTables()
  })

  test('define sideloaded properties using $consumeAdapterResults method', async ({
    fs,
    assert,
  }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const adapter = new FakeAdapter()

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column()
      declare username: string
    }

    const user = new User()
    user.$consumeAdapterResult({ username: 'virk' }, { loggedInUser: { id: 1 } })

    assert.deepEqual(user.$attributes, { username: 'virk' })
    assert.deepEqual(user.$sideloaded, { loggedInUser: { id: 1 } })
  })

  test('define sideloaded properties using $createFromAdapterResult method', async ({
    fs,
    assert,
  }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const adapter = new FakeAdapter()

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column()
      declare username: string
    }

    const user = User.$createFromAdapterResult({ username: 'virk' }, { loggedInUser: { id: 1 } })!
    assert.deepEqual(user.$attributes, { username: 'virk' })
    assert.deepEqual(user.$sideloaded, { loggedInUser: { id: 1 } })
  })

  test('define sideloaded properties using $createMultipleFromAdapterResult method', async ({
    assert,
    fs,
  }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const adapter = new FakeAdapter()

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column()
      declare username: string
    }

    const users = User.$createMultipleFromAdapterResult(
      [{ username: 'virk' }, { username: 'nikk' }],
      { loggedInUser: { id: 1 } }
    )

    assert.deepEqual(users[0].$attributes, { username: 'virk' })
    assert.deepEqual(users[0].$sideloaded, { loggedInUser: { id: 1 } })

    assert.deepEqual(users[1].$attributes, { username: 'nikk' })
    assert.deepEqual(users[1].$sideloaded, { loggedInUser: { id: 1 } })
  })

  // @todo: PASS SIDELOADED PROPERTIES TO RELATIONSHIPS AS WELL
})

test.group('Base Model | relations', (group) => {
  group.setup(async () => {
    await setup()
  })

  group.teardown(async () => {
    await cleanupTables()
  })

  test('set hasOne relation', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const adapter = new FakeAdapter()

    const BaseModel = getBaseModel(adapter)

    class Profile extends BaseModel {
      @column()
      declare username: string

      @column()
      declare userId: number
    }

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @hasOne(() => Profile)
      declare profile: HasOne<typeof Profile>
    }

    const user = new User()
    Profile.$adapter = adapter
    user.$consumeAdapterResult({ id: 1 })
    user.$setRelated('profile', await Profile.create({ username: 'virk' }))

    assert.deepEqual(user.profile.username, 'virk')
    assert.instanceOf(user.$preloaded.profile, Profile)
  })

  test('return undefined when relation is not preloaded', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const adapter = new FakeAdapter()

    const BaseModel = getBaseModel(adapter)

    class Profile extends BaseModel {
      @column()
      declare username: string

      @column()
      declare userId: number
    }

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @hasOne(() => Profile)
      declare profile: HasOne<typeof Profile>
    }

    const user = new User()
    user.$consumeAdapterResult({
      id: 1,
    })

    assert.isUndefined(user.profile)
    assert.deepEqual(user.$preloaded, {})
  })

  test('serialize relation toJSON', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const adapter = new FakeAdapter()

    const BaseModel = getBaseModel(adapter)

    class Profile extends BaseModel {
      @column()
      declare username: string

      @column()
      declare userId: number
    }

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @hasOne(() => Profile)
      declare profile: HasOne<typeof Profile>
    }

    const user = new User()
    Profile.$adapter = adapter
    user.$consumeAdapterResult({ id: 1 })
    user.$setRelated('profile', await Profile.create({ username: 'virk' }))

    assert.deepEqual(user.toJSON(), {
      id: 1,
      profile: {
        username: 'virk',
      },
    })
  })

  test('cherry pick relationship keys during serialize', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const adapter = new FakeAdapter()

    const BaseModel = getBaseModel(adapter)

    class Profile extends BaseModel {
      @column()
      declare username: string

      @column()
      declare userId: number
    }

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @hasOne(() => Profile)
      declare profile: HasOne<typeof Profile>
    }

    const user = new User()
    Profile.$adapter = adapter
    user.$consumeAdapterResult({ id: 1 })

    const profile = await Profile.create({ username: 'virk' })
    user.$setRelated('profile', profile)
    profile.userId = 1

    assert.deepEqual(
      user.serialize({
        fields: ['id'],
        relations: {
          profile: {
            fields: ['username'],
          },
        },
      }),
      {
        id: 1,
        profile: {
          username: 'virk',
        },
      }
    )
  })

  test('cherry pick nested relationship keys during serialize', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const adapter = new FakeAdapter()

    const BaseModel = getBaseModel(adapter)

    class Profile extends BaseModel {
      @column()
      declare username: string

      @column()
      declare userId: number

      @belongsTo(() => User)
      declare user: BelongsTo<typeof User>
    }

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare email: string

      @hasOne(() => Profile)
      declare profile: HasOne<typeof Profile>
    }

    Profile.$adapter = adapter

    const user = new User()
    user.$consumeAdapterResult({ id: 1, email: 'virk@adonisjs.com' })

    const profileUser = new User()
    profileUser.$consumeAdapterResult({ id: 1, email: 'virk@adonisjs.com' })

    const profile = await Profile.create({ username: 'virk' })
    user.$setRelated('profile', profile)
    profile.$setRelated('user', profileUser)
    profile.userId = 1

    assert.deepEqual(
      user.serialize({
        fields: ['id'],
        relations: {
          profile: {
            fields: ['username'],
            relations: {
              user: {
                fields: ['email'],
              },
            },
          },
        },
      }),
      {
        id: 1,
        profile: {
          username: 'virk',
          user: {
            email: 'virk@adonisjs.com',
          },
        },
      }
    )
  })

  test('serialize relation toJSON with custom serializeAs key', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const adapter = new FakeAdapter()

    const BaseModel = getBaseModel(adapter)

    class Profile extends BaseModel {
      @column()
      declare username: string

      @column()
      declare userId: number
    }

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @hasOne(() => Profile, { serializeAs: 'social' })
      declare profile: HasOne<typeof Profile>
    }

    const user = new User()
    Profile.$adapter = adapter
    user.$consumeAdapterResult({ id: 1 })
    user.$setRelated('profile', await Profile.create({ username: 'virk' }))

    assert.deepEqual(user.toJSON(), {
      id: 1,
      social: {
        username: 'virk',
      },
    })
  })

  test('push relationship', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const adapter = new FakeAdapter()

    const BaseModel = getBaseModel(adapter)

    class Profile extends BaseModel {
      @column()
      declare username: string

      @column()
      declare userId: number
    }

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @hasMany(() => Profile)
      declare profiles: HasMany<typeof Profile>
    }

    const user = new User()
    Profile.$adapter = adapter
    user.$consumeAdapterResult({ id: 1 })
    user.$pushRelated('profiles', await Profile.create({ username: 'nikk' }))

    assert.deepEqual(user.toJSON(), {
      id: 1,
      profiles: [
        {
          username: 'nikk',
        },
      ],
    })
  })

  test('push relationship to existing list', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const adapter = new FakeAdapter()

    const BaseModel = getBaseModel(adapter)

    class Profile extends BaseModel {
      @column()
      declare username: string

      @column()
      declare userId: number
    }

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @hasMany(() => Profile)
      declare profiles: HasMany<typeof Profile>
    }

    const user = new User()
    Profile.$adapter = adapter
    user.$consumeAdapterResult({ id: 1 })
    user.$setRelated('profiles', [await Profile.create({ username: 'virk' })])
    user.$pushRelated('profiles', await Profile.create({ username: 'nikk' }))

    assert.deepEqual(user.toJSON(), {
      id: 1,
      profiles: [
        {
          username: 'virk',
        },
        {
          username: 'nikk',
        },
      ],
    })
  })

  test('push an array of relationships', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const adapter = new FakeAdapter()

    const BaseModel = getBaseModel(adapter)

    class Profile extends BaseModel {
      @column()
      declare username: string

      @column()
      declare userId: number
    }

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @hasMany(() => Profile)
      declare profiles: HasMany<typeof Profile>
    }

    const user = new User()
    Profile.$adapter = adapter
    user.$consumeAdapterResult({ id: 1 })
    user.$pushRelated('profiles', [
      await Profile.create({ username: 'virk' }),
      await Profile.create({ username: 'nikk' }),
    ])

    assert.deepEqual(user.toJSON(), {
      id: 1,
      profiles: [
        {
          username: 'virk',
        },
        {
          username: 'nikk',
        },
      ],
    })
  })

  test('raise error when pushing an array of relationships for hasOne', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const adapter = new FakeAdapter()

    const BaseModel = getBaseModel(adapter)

    class Profile extends BaseModel {
      @column()
      declare username: string

      @column()
      declare userId: number
    }

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @hasOne(() => Profile)
      declare profile: HasOne<typeof Profile>
    }

    const user = new User()
    Profile.$adapter = adapter
    user.$consumeAdapterResult({ id: 1 })

    const profile = await Profile.create({ username: 'virk' })
    const profile1 = await Profile.create({ username: 'virk' })

    const fn = () => user.$pushRelated('profile', [profile, profile1] as any)
    assert.throws(fn, '"User.profile" cannot reference more than one instance of "Profile" model')
  })

  test('raise error when setting single relationships for hasMany', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const adapter = new FakeAdapter()

    const BaseModel = getBaseModel(adapter)

    class Profile extends BaseModel {
      @column()
      declare username: string

      @column()
      declare userId: number
    }

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @hasMany(() => Profile)
      declare profiles: HasMany<typeof Profile>
    }

    const user = new User()
    Profile.$adapter = adapter
    user.$consumeAdapterResult({ id: 1 })

    const profile = await Profile.create({ username: 'virk' })

    const fn = () => user.$setRelated('profiles', profile as any)
    assert.throws(fn, '"User.profiles" must be an array when setting "hasMany" relationship')
  })
})

test.group('Base Model | fetch', (group) => {
  group.setup(async () => {
    await setup()
  })

  group.teardown(async () => {
    await cleanupTables()
  })

  group.each.teardown(async () => {
    await resetTables()
  })

  test('find using the primary key', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare username: string

      @column()
      declare email: string
    }

    await db.insertQuery().table('users').insert({ username: 'virk' })
    const user = await User.find(1)

    assert.instanceOf(user, User)
    assert.equal(user!.$primaryKeyValue, 1)
  })

  test('raise exception when row is not found', async ({ fs, assert }) => {
    assert.plan(1)

    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare username: string

      @column()
      declare email: string
    }

    try {
      await User.findOrFail(1)
    } catch ({ message }) {
      assert.equal(message, 'Row not found')
    }
  })

  test('find many using the primary key', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare username: string

      @column()
      declare email: string
    }

    await db
      .insertQuery()
      .table('users')
      .multiInsert([{ username: 'virk' }, { username: 'nikk' }])

    const users = await User.findMany([1, 2])
    assert.lengthOf(users, 2)
    assert.equal(users[0].$primaryKeyValue, 2)
    assert.equal(users[1].$primaryKeyValue, 1)
  })

  test('findBy using a clause', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare username: string

      @column()
      declare email: string
    }

    await db
      .insertQuery()
      .table('users')
      .multiInsert([{ username: 'virk' }, { username: 'nikk' }])

    const user = await User.findBy({ username: 'virk' })
    assert.isDefined(user)
    assert.equal(user?.username, 'virk')
  })

  test('findBy using a key/value pair', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare username: string

      @column()
      declare email: string
    }

    await db
      .insertQuery()
      .table('users')
      .multiInsert([{ username: 'virk' }, { username: 'nikk' }])

    const user = await User.findBy('username', 'virk')
    assert.isDefined(user)
    assert.equal(user?.username, 'virk')
  })

  test('find many using a clause', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare username: string

      @column()
      declare email: string
    }

    await db
      .insertQuery()
      .table('users')
      .multiInsert([{ username: 'virk' }, { username: 'nikk' }])

    const users = await User.findManyBy({ points: 0 })
    assert.lengthOf(users, 2)
    assert.equal(users[0].$primaryKeyValue, 1)
    assert.equal(users[1].$primaryKeyValue, 2)
  })

  test('find many using a key/value pair', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare username: string

      @column()
      declare email: string
    }

    await db
      .insertQuery()
      .table('users')
      .multiInsert([{ username: 'virk' }, { username: 'nikk' }])

    const users = await User.findManyBy('points', 0)
    assert.lengthOf(users, 2)
    assert.equal(users[0].$primaryKeyValue, 1)
    assert.equal(users[1].$primaryKeyValue, 2)
  })

  test('return the existing row when search criteria matches', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column({ columnName: 'username' })
      declare userName: string

      @column()
      declare email: string
    }

    await db.insertQuery().table('users').insert({ username: 'virk' })
    const user = await User.firstOrCreate({ userName: 'virk' })

    const totalUsers = await db.query().from('users').count('*', 'total')

    assert.equal(totalUsers[0].total, 1)
    assert.isTrue(user.$isPersisted)
    assert.instanceOf(user, User)
    assert.equal(user!.$primaryKeyValue, 1)
  })

  test("create new row when search criteria doesn't match", async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column({ columnName: 'username' })
      declare userName: string

      @column()
      declare email: string
    }

    await db.insertQuery().table('users').insert({ username: 'virk' })
    const user = await User.firstOrCreate({ userName: 'nikk' }, { email: 'nikk@gmail.com' })

    const totalUsers = await db.query().from('users').count('*', 'total')

    assert.equal(totalUsers[0].total, 2)
    assert.instanceOf(user, User)

    assert.equal(user!.$primaryKeyValue, 2)
    assert.isTrue(user.$isPersisted)
    assert.equal(user!.email, 'nikk@gmail.com')
    assert.equal(user!.userName, 'nikk')
  })

  test('return the existing row when search criteria matches using firstOrNew', async ({
    assert,
    fs,
  }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column({ columnName: 'username' })
      declare userName: string

      @column()
      declare email: string
    }

    await db.insertQuery().table('users').insert({ username: 'virk' })
    const user = await User.firstOrNew({ userName: 'virk' })

    const totalUsers = await db.query().from('users').count('*', 'total')

    assert.equal(totalUsers[0].total, 1)
    assert.instanceOf(user, User)
    assert.isTrue(user.$isPersisted)
    assert.equal(user!.$primaryKeyValue, 1)
  })

  test("instantiate new row when search criteria doesn't match using firstOrNew", async ({
    assert,
    fs,
  }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column({ columnName: 'username' })
      declare userName: string

      @column()
      declare email: string
    }

    await db.insertQuery().table('users').insert({ username: 'virk' })
    const user = await User.firstOrNew({ userName: 'nikk' }, { email: 'nikk@gmail.com' })

    const totalUsers = await db.query().from('users').count('*', 'total')

    assert.equal(totalUsers[0].total, 1)
    assert.instanceOf(user, User)

    assert.isUndefined(user!.$primaryKeyValue)
    assert.isFalse(user.$isPersisted)
    assert.equal(user!.email, 'nikk@gmail.com')
    assert.equal(user!.userName, 'nikk')
  })

  test('update the existing row when search criteria matches', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column({ columnName: 'username' })
      declare userName: string

      @column()
      declare email: string

      @column()
      declare points: number
    }

    await db.insertQuery().table('users').insert({ username: 'virk' })
    const user = await User.updateOrCreate({ userName: 'virk' }, { points: 20 })
    assert.isTrue(user.$isPersisted)
    assert.equal(user.points, 20)
    assert.equal(user.userName, 'virk')

    const users = await db.query().from('users')

    assert.lengthOf(users, 1)
    assert.equal(users[0].points, 20)
  })

  test('lock row for update to handle concurrent requests', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column({ columnName: 'username' })
      declare userName: string

      @column()
      declare email: string

      @column()
      declare points: number

      static boot() {
        if (this.booted) {
          return
        }

        super.boot()
        this.before('update', (model) => {
          model.points += 1
        })
      }
    }

    await db.insertQuery().table('users').insert({ username: 'virk', points: 20 })

    /**
     * The update or create method will first fetch the row and then performs
     * an update using the model instance. The model hook will use the original
     * database value to increment the points by 1.
     *
     * However, both reads will be performed concurrently, each instance will
     * receive the original `20` points and update will reflect `21` and not
     * expected `22`.
     *
     * To fix the above issue, we must lock the row for update, since we can
     * guarantee that an update will always be performed.
     */
    await Promise.all([
      User.updateOrCreate({ userName: 'virk' }, { email: 'virk-1@adonisjs.com' }),
      User.updateOrCreate({ userName: 'virk' }, { email: 'virk-2@adonisjs.com' }),
    ])

    const users = await db.query().from('users')

    assert.lengthOf(users, 1)
    assert.equal(users[0].points, 22)
  })

  test('execute updateOrCreate update action inside a transaction', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column({ columnName: 'username' })
      declare userName: string

      @column()
      declare email: string

      @column()
      declare points: number
    }

    await db.insertQuery().table('users').insert({ username: 'virk' })
    const trx = await db.transaction()

    const user = await User.updateOrCreate({ userName: 'virk' }, { points: 20 }, { client: trx })

    assert.isTrue(user.$isPersisted)
    assert.equal(user.points, 20)
    assert.equal(user.userName, 'virk')

    await trx.rollback()

    const users = await db.query().from('users')
    assert.lengthOf(users, 1)

    assert.equal(users[0].username, 'virk')
    assert.equal(users[0].points, 0)
  })

  test('create a new row when search criteria fails', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare username: string

      @column()
      declare email: string

      @column()
      declare points: number
    }

    await db.insertQuery().table('users').insert({ username: 'virk' })
    const user = await User.updateOrCreate({ username: 'nikk' }, { points: 20 })

    assert.isTrue(user.$isPersisted)
    assert.equal(user.points, 20)
    assert.equal(user.username, 'nikk')

    const users = await db.query().from('users')
    assert.lengthOf(users, 2)

    assert.equal(users[0].username, 'virk')
    assert.equal(users[0].points, 0)

    assert.equal(users[1].username, 'nikk')
    assert.equal(users[1].points, 20)
  })

  test('execute updateOrCreate create action inside a transaction', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare username: string

      @column()
      declare email: string

      @column()
      declare points: number
    }

    await db.insertQuery().table('users').insert({ username: 'virk' })
    const trx = await db.transaction()

    const user = await User.updateOrCreate({ username: 'nikk' }, { points: 20 }, { client: trx })

    assert.isTrue(user.$isPersisted)
    assert.equal(user.points, 20)
    assert.equal(user.username, 'nikk')

    await trx.rollback()

    const users = await db.query().from('users')
    assert.lengthOf(users, 1)

    assert.equal(users[0].username, 'virk')
    assert.equal(users[0].points, 0)
  })

  test('persist records to db when find call returns zero rows', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare username: string

      @column()
      declare email: string

      @column()
      declare points: number
    }

    const users = await User.fetchOrCreateMany('username', [
      {
        username: 'virk',
        email: 'virk@adonisjs.com',
      },
      {
        username: 'nikk',
        email: 'nikk@adonisjs.com',
      },
      {
        username: 'romain',
        email: 'romain@adonisjs.com',
      },
    ])

    assert.lengthOf(users, 3)
    assert.isTrue(users[0].$isPersisted)
    assert.equal(users[0].username, 'virk')
    assert.equal(users[0].email, 'virk@adonisjs.com')

    assert.isTrue(users[1].$isPersisted)
    assert.equal(users[1].username, 'nikk')
    assert.equal(users[1].email, 'nikk@adonisjs.com')

    assert.isTrue(users[2].$isPersisted)
    assert.equal(users[2].username, 'romain')
    assert.equal(users[2].email, 'romain@adonisjs.com')

    const usersList = await db.query().from('users')
    assert.lengthOf(usersList, 3)
  })

  test('sync records by avoiding duplicates', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare username: string

      @column()
      declare email: string

      @column()
      declare points: number
    }

    await db.insertQuery().table('users').insert({
      username: 'virk',
      email: 'virk@adonisjs.com',
      points: 10,
    })

    const users = await User.fetchOrCreateMany('username', [
      {
        username: 'virk',
        email: 'virk@adonisjs.com',
      },
      {
        username: 'nikk',
        email: 'nikk@adonisjs.com',
      },
      {
        username: 'romain',
        email: 'romain@adonisjs.com',
      },
    ])

    assert.lengthOf(users, 3)
    assert.isTrue(users[0].$isPersisted)
    assert.equal(users[0].username, 'virk')
    assert.equal(users[0].email, 'virk@adonisjs.com')
    assert.equal(users[0].points, 10)

    assert.isTrue(users[1].$isPersisted)
    assert.equal(users[1].username, 'nikk')
    assert.equal(users[1].email, 'nikk@adonisjs.com')
    assert.isUndefined(users[1].points)

    assert.isTrue(users[2].$isPersisted)
    assert.equal(users[2].username, 'romain')
    assert.equal(users[2].email, 'romain@adonisjs.com')
    assert.isUndefined(users[2].points)

    const usersList = await db.query().from('users')
    assert.lengthOf(usersList, 3)
  })

  test('wrap create calls inside a transaction', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare username: string

      @column()
      declare email: string

      @column()
      declare points: number
    }

    await db.insertQuery().table('users').insert({
      username: 'virk',
      email: 'virk@adonisjs.com',
      points: 10,
    })

    const trx = await db.transaction()

    await User.fetchOrCreateMany(
      'username',
      [
        {
          username: 'virk',
          email: 'virk@adonisjs.com',
        },
        {
          username: 'nikk',
          email: 'nikk@adonisjs.com',
        },
        {
          username: 'romain',
          email: 'romain@adonisjs.com',
        },
      ],
      {
        client: trx,
      }
    )

    await trx.rollback()
    const usersList = await db.query().from('users')
    assert.lengthOf(usersList, 1)
  })

  test('handle columns with different cast key name', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column({ columnName: 'username' })
      declare userName: string

      @column()
      declare email: string

      @column()
      declare points: number
    }

    await db.insertQuery().table('users').insert({
      username: 'virk',
      email: 'virk@adonisjs.com',
      points: 10,
    })

    const users = await User.fetchOrCreateMany('userName', [
      {
        userName: 'virk',
        email: 'virk@adonisjs.com',
      },
      {
        userName: 'nikk',
        email: 'nikk@adonisjs.com',
      },
      {
        userName: 'romain',
        email: 'romain@adonisjs.com',
      },
    ])

    assert.lengthOf(users, 3)
    assert.isTrue(users[0].$isPersisted)
    assert.equal(users[0].userName, 'virk')
    assert.equal(users[0].email, 'virk@adonisjs.com')
    assert.equal(users[0].points, 10)

    assert.isTrue(users[1].$isPersisted)
    assert.equal(users[1].userName, 'nikk')
    assert.equal(users[1].email, 'nikk@adonisjs.com')
    assert.isUndefined(users[1].points)

    assert.isTrue(users[2].$isPersisted)
    assert.equal(users[2].userName, 'romain')
    assert.equal(users[2].email, 'romain@adonisjs.com')
    assert.isUndefined(users[2].points)

    const usersList = await db.query().from('users')
    assert.lengthOf(usersList, 3)
  })

  test('raise exception when one or more rows fails', async ({ fs, assert }) => {
    assert.plan(2)

    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare username: string

      @column()
      declare email: string

      @column()
      declare points: number
    }

    await db.insertQuery().table('users').insert({
      username: 'virk',
      email: 'virk@adonisjs.com',
      points: 10,
    })

    const trx = await db.transaction()

    try {
      await User.fetchOrCreateMany(
        'username',
        [
          {
            username: 'nikk',
            email: 'virk@adonisjs.com',
          },
          {
            username: 'romain',
            email: 'romain@adonisjs.com',
          },
        ],
        {
          client: trx,
        }
      )
    } catch (error) {
      assert.exists(error)
      await trx.rollback()
    }

    const usersList = await db.query().from('users')
    assert.lengthOf(usersList, 1)
  })

  test('raise exception when value of unique key inside payload is undefined', async ({
    assert,
    fs,
  }) => {
    assert.plan(2)

    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare username: string

      @column()
      declare email: string

      @column()
      declare points: number
    }

    await db.insertQuery().table('users').insert({
      username: 'virk',
      email: 'virk@adonisjs.com',
      points: 10,
    })

    try {
      await User.fetchOrCreateMany('username', [
        {
          email: 'virk@adonisjs.com',
        },
        {
          username: 'romain',
          email: 'romain@adonisjs.com',
        },
      ])
    } catch ({ message }) {
      assert.equal(
        message,
        'Value for the "username" is null or undefined inside "fetchOrCreateMany" payload'
      )
    }

    const usersList = await db.query().from('users')
    assert.lengthOf(usersList, 1)
  })

  test('raise exception when key is not defined on the model', async ({ fs, assert }) => {
    assert.plan(2)

    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare email: string

      @column()
      declare points: number
    }

    await db.insertQuery().table('users').insert({
      username: 'virk',
      email: 'virk@adonisjs.com',
      points: 10,
    })

    try {
      await User.fetchOrCreateMany('username' as any, [
        {
          email: 'virk@adonisjs.com',
        },
        {
          username: 'romain',
          email: 'romain@adonisjs.com',
        } as any,
      ])
    } catch ({ message }) {
      assert.equal(
        message,
        'Value for the "username" is null or undefined inside "fetchOrCreateMany" payload'
      )
    }

    const usersList = await db.query().from('users')
    assert.lengthOf(usersList, 1)
  })

  test('persist records to db when find call returns zero rows', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare username: string

      @column()
      declare email: string

      @column()
      declare points: number
    }

    const users = await User.updateOrCreateMany('username', [
      {
        username: 'virk',
        email: 'virk@adonisjs.com',
      },
      {
        username: 'nikk',
        email: 'nikk@adonisjs.com',
      },
      {
        username: 'romain',
        email: 'romain@adonisjs.com',
      },
    ])

    assert.lengthOf(users, 3)
    assert.isTrue(users[0].$isPersisted)
    assert.equal(users[0].username, 'virk')
    assert.equal(users[0].email, 'virk@adonisjs.com')

    assert.isTrue(users[1].$isPersisted)
    assert.equal(users[1].username, 'nikk')
    assert.equal(users[1].email, 'nikk@adonisjs.com')

    assert.isTrue(users[2].$isPersisted)
    assert.equal(users[2].username, 'romain')
    assert.equal(users[2].email, 'romain@adonisjs.com')

    const usersList = await db.query().from('users')
    assert.lengthOf(usersList, 3)
  })

  test('update records and avoid duplicates', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare username: string

      @column()
      declare email: string

      @column()
      declare points: number
    }

    await db.insertQuery().table('users').insert({
      username: 'virk',
      email: 'virk@adonisjs.com',
      points: 10,
    })

    const users = await User.updateOrCreateMany('username', [
      {
        username: 'virk',
        email: 'virk@adonisjs.com',
        points: 4,
      },
      {
        username: 'nikk',
        email: 'nikk@adonisjs.com',
      },
      {
        username: 'romain',
        email: 'romain@adonisjs.com',
      },
    ])

    assert.lengthOf(users, 3)
    assert.isTrue(users[0].$isPersisted)
    assert.equal(users[0].username, 'virk')
    assert.equal(users[0].email, 'virk@adonisjs.com')
    assert.equal(users[0].points, 4)

    assert.isTrue(users[1].$isPersisted)
    assert.equal(users[1].username, 'nikk')
    assert.equal(users[1].email, 'nikk@adonisjs.com')
    assert.isUndefined(users[1].points)

    assert.isTrue(users[2].$isPersisted)
    assert.equal(users[2].username, 'romain')
    assert.equal(users[2].email, 'romain@adonisjs.com')
    assert.isUndefined(users[2].points)

    const usersList = await db.query().from('users')
    assert.lengthOf(usersList, 3)
  })

  test('use multiple keys to predicate a row as unique', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare username: string

      @column()
      declare email: string

      @column()
      declare countryId: number

      @column()
      declare points: number
    }

    await db.insertQuery().table('users').insert({
      username: 'virk',
      email: 'virk@adonisjs.com',
      country_id: 1,
      points: 10,
    })

    const users = await User.updateOrCreateMany(
      ['points', 'countryId'],
      [
        {
          username: 'virk1',
          email: 'virk1@adonisjs.com',
          countryId: 1,
          points: 11,
        },
        {
          username: 'nikk',
          email: 'nikk@adonisjs.com',
          countryId: 2,
          points: 10,
        },
        {
          username: 'romain',
          email: 'romain@adonisjs.com',
          countryId: 3,
          points: 10,
        },
      ]
    )

    assert.lengthOf(users, 3)
    assert.isTrue(users[0].$isPersisted)
    assert.equal(users[0].countryId, 1)
    assert.equal(users[0].points, 11)

    assert.isTrue(users[1].$isPersisted)
    assert.equal(users[1].countryId, 2)
    assert.equal(users[1].points, 10)

    assert.isTrue(users[2].$isPersisted)
    assert.equal(users[2].countryId, 3)
    assert.equal(users[2].points, 10)

    const usersList = await db.query().from('users')
    assert.lengthOf(usersList, 4)
  })

  test('wrap create calls inside a transaction using updateOrCreateMany', async ({
    fs,
    assert,
  }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare username: string

      @column()
      declare email: string

      @column()
      declare points: number
    }

    await db.insertQuery().table('users').insert({
      username: 'virk',
      email: 'virk@adonisjs.com',
      points: 10,
    })

    const trx = await db.transaction()

    await User.updateOrCreateMany(
      'username',
      [
        {
          username: 'virk',
          email: 'virk@adonisjs.com',
        },
        {
          username: 'nikk',
          email: 'nikk@adonisjs.com',
        },
        {
          username: 'romain',
          email: 'romain@adonisjs.com',
        },
      ],
      {
        client: trx,
      }
    )

    await trx.rollback()
    const usersList = await db.query().from('users')
    assert.lengthOf(usersList, 1)
  })

  test('wrap update calls inside a custom transaction using updateOrCreateMany', async ({
    assert,
    fs,
  }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare username: string

      @column()
      declare email: string

      @column()
      declare points: number
    }

    await db.insertQuery().table('users').insert({
      username: 'virk',
      email: 'virk@adonisjs.com',
      points: 10,
    })

    const trx = await db.transaction()

    await User.updateOrCreateMany(
      'username',
      [
        {
          username: 'virk',
          email: 'virk@adonisjs.com',
          points: 4,
        },
        {
          username: 'nikk',
          email: 'nikk@adonisjs.com',
        },
        {
          username: 'romain',
          email: 'romain@adonisjs.com',
        },
      ],
      {
        client: trx,
      }
    )

    await trx.rollback()
    const usersList = await db.query().from('users')
    assert.lengthOf(usersList, 1)
    assert.equal(usersList[0].points, 10)
  })

  test('handle concurrent update calls using updateOrCreateMany', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare username: string

      @column()
      declare email: string

      @column()
      declare points: number

      static boot() {
        if (this.booted) {
          return
        }

        super.boot()
        this.before('update', (model) => {
          model.points += 1
        })
      }
    }

    await db.insertQuery().table('users').insert({
      username: 'virk',
      email: 'virk@adonisjs.com',
      points: 0,
    })

    await Promise.all([
      User.updateOrCreateMany('username', [
        {
          username: 'virk',
          email: 'virk-1@adonisjs.com',
        },
      ]),
      User.updateOrCreateMany('username', [
        {
          username: 'virk',
          email: 'virk-1@adonisjs.com',
        },
      ]),
    ])

    const usersList = await db.query().from('users')
    assert.lengthOf(usersList, 1)
    assert.equal(usersList[0].points, 2)
  })

  test('updateOrCreateMany should work with DateTime', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare username: string

      @column()
      declare email: string

      @column.dateTime()
      declare createdAt: DateTime
    }

    const createdAt1 = DateTime.now().minus({ days: 2 }).startOf('second')
    const createdAt2 = DateTime.now().minus({ days: 1 }).startOf('second')

    await User.createMany([
      {
        username: 'virk1',
        email: 'virk+1@adonisjs.com',
        createdAt: createdAt1,
      },
      {
        username: 'virk2',
        email: 'virk+2@adonisjs.com',
        createdAt: createdAt2,
      },
    ])

    const users = await User.updateOrCreateMany('createdAt', [
      {
        username: 'virk3',
        email: 'virk+3@adonisjs.com',
        createdAt: createdAt1,
      },
      {
        username: 'nikk',
        email: 'nikk@adonisjs.com',
        createdAt: DateTime.now(),
      },
    ])

    assert.lengthOf(users, 2)
    assert.isTrue(users[0].$isPersisted)
    assert.isFalse(users[0].$isLocal)

    assert.isTrue(users[1].$isPersisted)
    assert.isTrue(users[1].$isLocal)

    const usersList = await db.query().from('users')
    assert.lengthOf(usersList, 3)
  })
})

test.group('Base Model | hooks', (group) => {
  group.setup(async () => {
    await setup()
  })

  group.teardown(async () => {
    await cleanupTables()
  })

  group.each.teardown(async () => {
    await resetTables()
  })

  test('invoke before and after create hooks', async ({ fs, assert }) => {
    assert.plan(9)

    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    const stack: string[] = []

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare username: string

      @column()
      declare email: string

      @beforeCreate()
      static beforeCreateHook(model: User) {
        stack.push('beforeCreateHook')
        assert.instanceOf(model, User)
        assert.isFalse(model.$isPersisted)
      }

      @beforeSave()
      static beforeSaveHook(model: User) {
        stack.push('beforeSaveHook')
        assert.instanceOf(model, User)
        assert.isFalse(model.$isPersisted)
      }

      @afterCreate()
      static afterCreateHook(model: User) {
        stack.push('afterCreateHook')
        assert.instanceOf(model, User)
        assert.isTrue(model.$isPersisted)
      }

      @afterSave()
      static afterSaveHook(model: User) {
        stack.push('afterSaveHook')
        assert.instanceOf(model, User)
        assert.isTrue(model.$isPersisted)
      }
    }

    const user = new User()
    user.username = 'virk'
    await user.save()

    assert.deepEqual(stack, [
      'beforeCreateHook',
      'beforeSaveHook',
      'afterCreateHook',
      'afterSaveHook',
    ])
  })

  test('abort create when before hook raises exception', async ({ fs, assert }) => {
    assert.plan(3)

    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare username: string

      @column()
      declare email: string

      static boot() {
        if (this.booted) {
          return
        }

        super.boot()

        this.before('create', (model) => {
          assert.instanceOf(model, User)
          assert.isFalse(model.$isPersisted)
          throw new Error('Wait')
        })

        this.before('save', (model) => {
          assert.instanceOf(model, User)
          assert.isFalse(model.$isPersisted)
        })

        this.after('create', (model) => {
          assert.instanceOf(model, User)
          assert.isTrue(model.$isPersisted)
        })

        this.after('save', (model) => {
          assert.instanceOf(model, User)
          assert.isTrue(model.$isPersisted)
        })
      }
    }

    const user = new User()
    user.username = 'virk'

    try {
      await user.save()
    } catch ({ message }) {
      assert.equal(message, 'Wait')
    }
  })

  test('listen for trx on after save commit', async ({ fs, assert }) => {
    assert.plan(1)

    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare username: string

      @column()
      declare email: string

      @afterSave()
      static afterSaveHook(model: User) {
        if (model.$trx) {
          model.$trx.on('commit', () => {
            assert.isTrue(true)
          })
        }
      }
    }

    const trx = await db.transaction()

    const user = new User()
    user.username = 'virk'
    user.$trx = trx
    await user.save()

    await trx.commit()
  })

  test('listen for trx on after save rollback', async ({ fs, assert }) => {
    assert.plan(1)

    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare username: string

      @column()
      declare email: string

      @afterSave()
      static afterSaveHook(model: User) {
        if (model.$trx) {
          model.$trx.on('rollback', () => {
            assert.isTrue(true)
          })
        }
      }
    }

    const trx = await db.transaction()

    const user = new User()
    user.username = 'virk'
    user.$trx = trx
    await user.save()

    await trx.rollback()
  })

  test('invoke before and after update hooks', async ({ fs, assert }) => {
    assert.plan(10)

    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare username: string

      @column()
      declare email: string

      @beforeUpdate()
      static beforeUpdateHook(model: User) {
        assert.instanceOf(model, User)
        assert.isTrue(model.$isDirty)
      }

      @beforeSave()
      static beforeSaveHook(model: User) {
        assert.instanceOf(model, User)
        assert.isTrue(model.$isDirty)
      }

      @afterUpdate()
      static afterUpdateHook(model: User) {
        assert.instanceOf(model, User)
        assert.isFalse(model.$isDirty)
      }

      @afterSave()
      static afterSaveHook(model: User) {
        assert.instanceOf(model, User)
        assert.isFalse(model.$isDirty)
      }
    }

    await db.insertQuery().table('users').insert({ username: 'virk' })
    const user = await User.findOrFail(1)

    user.username = 'nikk'
    await user.save()

    const users = await db.from('users')
    assert.lengthOf(users, 1)
    assert.equal(users[0].username, 'nikk')
  })

  test('abort update when before hook raises exception', async ({ fs, assert }) => {
    assert.plan(5)

    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare username: string

      @column()
      declare email: string

      static boot() {
        if (this.booted) {
          return
        }

        super.boot()

        this.before('update', (model) => {
          assert.instanceOf(model, User)
          assert.isTrue(model.$isDirty)
          throw new Error('Wait')
        })

        this.before('save', (model) => {
          assert.instanceOf(model, User)
          assert.isTrue(model.$isDirty)
        })

        this.after('update', (model) => {
          assert.instanceOf(model, User)
          assert.isFalse(model.$isDirty)
        })

        this.after('save', (model) => {
          assert.instanceOf(model, User)
          assert.isFalse(model.$isDirty)
        })
      }
    }

    await db.insertQuery().table('users').insert({ username: 'virk' })
    const user = await User.findOrFail(1)

    user.username = 'nikk'

    try {
      await user.save()
    } catch ({ message }) {
      assert.equal(message, 'Wait')
    }

    const users = await db.from('users')
    assert.lengthOf(users, 1)
    assert.equal(users[0].username, 'virk')
  })

  test('invoke before and after delete hooks', async ({ fs, assert }) => {
    assert.plan(3)

    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare username: string

      @column()
      declare email: string

      @beforeDelete()
      static beforeDeleteHook(model: User) {
        assert.instanceOf(model, User)
      }

      @afterDelete()
      static afterDeleteHook(model: User) {
        assert.instanceOf(model, User)
      }
    }

    await db.insertQuery().table('users').insert({ username: 'virk' })
    const user = await User.findOrFail(1)
    await user.delete()

    const usersCount = await db.from('users').count('*', 'total')
    assert.equal(usersCount[0].total, 0)
  })

  test('abort delete when before hook raises exception', async ({ fs, assert }) => {
    assert.plan(3)

    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare username: string

      @column()
      declare email: string

      static boot() {
        if (this.booted) {
          return
        }

        super.boot()

        this.before('delete', (model) => {
          assert.instanceOf(model, User)
          throw new Error('Wait')
        })

        this.after('delete', (model) => {
          assert.instanceOf(model, User)
        })
      }
    }

    await db.insertQuery().table('users').insert({ username: 'virk' })
    const user = await User.findOrFail(1)

    try {
      await user.delete()
    } catch ({ message }) {
      assert.equal(message, 'Wait')
    }

    const usersCount = await db.from('users').count('*', 'total')
    assert.equal(usersCount[0].total, 1)
  })

  test('invoke before and after fetch hooks', async ({ fs, assert }) => {
    assert.plan(3)

    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare username: string

      @column()
      declare email: string

      @beforeFetch()
      static beforeFetchHook(query: ModelQueryBuilder) {
        assert.instanceOf(query, ModelQueryBuilder)
      }

      @afterFetch()
      static afterFetchHook(users: User[]) {
        assert.lengthOf(users, 1)
        assert.equal(users[0].username, 'virk')
      }
    }

    await db.insertQuery().table('users').insert({ username: 'virk' })
    await User.query()
  })

  test('@regression do not invoke after fetch hooks when updating rows', async ({ fs }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare username: string

      @column()
      declare email: string

      @beforeFetch()
      static beforeFetchHook() {
        throw new Error('Never expected to reach here')
      }

      @afterFetch()
      static afterFetchHook() {
        throw new Error('Never expected to reach here')
      }
    }

    await db.insertQuery().table('users').insert({ username: 'virk' })
    await User.query().update({ username: 'nikk' })
  })

  test('@regression do not invoke after fetch hooks when deleting rows', async ({ fs }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare username: string

      @column()
      declare email: string

      @beforeFetch()
      static beforeFetchHook() {
        throw new Error('Never expected to reach here')
      }

      @afterFetch()
      static afterFetchHook() {
        throw new Error('Never expected to reach here')
      }
    }

    await db.insertQuery().table('users').insert({ username: 'virk' })
    await User.query().del()
  })

  test('invoke before and after find hooks', async ({ fs, assert }) => {
    assert.plan(2)

    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare username: string

      @column()
      declare email: string

      @beforeFind()
      static beforeFindHook(query: ModelQueryBuilder) {
        assert.instanceOf(query, ModelQueryBuilder)
      }

      @afterFind()
      static afterFindHook(user: User) {
        assert.equal(user.username, 'virk')
      }
    }

    await db.insertQuery().table('users').insert({ username: 'virk' })
    await User.find(1)
  })

  test('invoke before and after find hooks when .first method is used', async ({ fs, assert }) => {
    assert.plan(2)

    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare username: string

      @column()
      declare email: string

      @beforeFind()
      static beforeFindHook(query: ModelQueryBuilder) {
        assert.instanceOf(query, ModelQueryBuilder)
      }

      @afterFind()
      static afterFindHook(user: User) {
        assert.equal(user.username, 'virk')
      }
    }

    await db.insertQuery().table('users').insert({ username: 'virk' })
    await User.query().where('id', 1).first()
  })

  test('invoke before and after paginate hooks', async ({ fs, assert }) => {
    assert.plan(5)

    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare username: string

      @column()
      declare email: string

      @beforePaginate()
      static beforePaginateHook([countQuery, query]: [ModelQueryBuilder, ModelQueryBuilder]) {
        assert.instanceOf(query, ModelQueryBuilder)
        assert.instanceOf(countQuery, ModelQueryBuilder)
        assert.notDeepEqual(countQuery, query)
      }

      @afterPaginate()
      static afterPaginateHook(paginator: SimplePaginator) {
        assert.equal(paginator.total, 1)
        assert.equal(paginator.all()[0].username, 'virk')
      }
    }

    await db.insertQuery().table('users').insert({ username: 'virk' })
    await User.query().paginate(1)
  })

  test('invoke before and after fetch hooks on paginate', async ({ fs, assert }) => {
    assert.plan(2)

    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare username: string

      @column()
      declare email: string

      @beforeFetch()
      static beforeFetchHook(query: ModelQueryBuilder) {
        assert.instanceOf(query, ModelQueryBuilder)
      }

      @afterFetch()
      static afterFetchHook(users: User[]) {
        assert.equal(users[0].username, 'virk')
      }
    }

    await db.insertQuery().table('users').insert({ username: 'virk' })
    await User.query().paginate(1)
  })

  test('do not invoke before and after paginate hooks when using pojo', async ({ fs }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare username: string

      @column()
      declare email: string

      @beforePaginate()
      static beforePaginateHook() {
        throw new Error('Never expected to reached here')
      }

      @afterPaginate()
      static afterPaginateHook() {
        throw new Error('Never expected to reached here')
      }
    }

    await db.insertQuery().table('users').insert({ username: 'virk' })
    await User.query().pojo().paginate(1)
  })

  test('@regression resolve update keys when an object is passed', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column({ columnName: 'username' })
      declare theUserName: string

      @column()
      declare email: string
    }

    await db.table('users').insert({ username: 'virk' })
    await User.query().update({ theUserName: 'nikk' })

    const users = await db.from('users').select('*')
    assert.equal(users[0].username, 'nikk')
  })

  test('@regression resolve update keys when a key value pair is passed', async ({
    fs,
    assert,
  }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column({ columnName: 'username' })
      declare theUserName: string

      @column()
      declare email: string
    }

    await db.table('users').insert({ username: 'virk' })
    await User.query().update('theUserName', 'nikk')

    const users = await db.from('users').select('*')
    assert.equal(users[0].username, 'nikk')
  })
})

test.group('Base Model | aggregates', (group) => {
  group.setup(async () => {
    await setup()
  })

  group.teardown(async () => {
    await cleanupTables()
  })

  group.each.teardown(async () => {
    await resetTables()
  })

  test('count *', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare username: string

      @column()
      declare email: string
    }

    await db
      .insertQuery()
      .table('users')
      .multiInsert([{ username: 'virk' }, { username: 'nikk' }])
    const usersCount = await User.query().count('* as total')
    assert.deepEqual(
      usersCount.map((row) => {
        return {
          total: Number(row.$extras.total),
        }
      }),
      [{ total: 2 }]
    )
  })

  test('count * distinct', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare username: string

      @column()
      declare email: string
    }

    await db
      .insertQuery()
      .table('users')
      .multiInsert([{ username: 'virk' }, { username: 'nikk' }])
    const usersCount = await User.query().countDistinct('username as total')
    assert.deepEqual(
      usersCount.map((row) => {
        return {
          total: Number(row.$extras.total),
        }
      }),
      [{ total: 2 }]
    )
  })
})

test.group('Base Model | date', (group) => {
  group.setup(async () => {
    await setup()
  })

  group.teardown(async () => {
    await cleanupTables()
  })

  group.each.teardown(async () => {
    await resetTables()
  })

  test('define date column', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare username: string

      @column.date()
      declare dob: DateTime
    }

    assert.deepEqual(User.$getColumn('dob')!.meta, {
      autoCreate: false,
      autoUpdate: false,
      type: 'date',
    })
  })

  test('define date column and turn on autoCreate flag', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare username: string

      @column.date({ autoCreate: true })
      declare dob: DateTime
    }

    assert.deepEqual(User.$getColumn('dob')!.meta, {
      autoCreate: true,
      autoUpdate: false,
      type: 'date',
    })
  })

  test('define date column and turn on autoUpdate flag', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare username: string

      @column.date({ autoUpdate: true })
      declare dob: DateTime
    }

    assert.deepEqual(User.$getColumn('dob')!.meta, {
      autoCreate: false,
      autoUpdate: true,
      type: 'date',
    })
  })

  test('initiate date column values with current date when missing', async ({ fs, assert }) => {
    assert.plan(1)

    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()

    const adapter = new FakeAdapter()
    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare username: string

      @column.date({ autoCreate: true })
      declare dob: DateTime
    }

    const user = new User()
    User.$adapter = adapter

    adapter.on('insert', (model: LucidRow, _: any) => {
      assert.instanceOf((model as User).dob, DateTime as any)
    })

    user.username = 'virk'
    await user.save()
  })

  test('do initiate date column values with current date when autoCreate is off', async ({
    assert,
    fs,
  }) => {
    assert.plan(2)

    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()

    const adapter = new FakeAdapter()
    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare username: string

      @column.date({ autoCreate: true })
      declare dob: DateTime

      @column.date()
      declare createdAt: DateTime
    }

    const user = new User()
    User.$adapter = adapter

    adapter.on('insert', (model: LucidRow, _: any) => {
      assert.instanceOf((model as User).dob, DateTime as any)
      assert.isUndefined((model as User).createdAt)
    })

    user.username = 'virk'
    await user.save()
  })

  test('always update date column value when autoUpdate is on', async ({ fs, assert }) => {
    assert.plan(1)

    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()

    const adapter = new FakeAdapter()
    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare username: string

      @column.date({ autoUpdate: true })
      declare updatedAt: DateTime
    }

    const user = new User()
    User.$adapter = adapter
    adapter.on('update', (model: LucidRow) => {
      assert.instanceOf((model as User).updatedAt, DateTime as any)
    })

    user.username = 'virk'
    await user.save()

    user.username = 'nikk'
    await user.save()
  })

  test('format date instance to string before sending to the adapter', async ({ fs, assert }) => {
    assert.plan(1)

    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()

    const adapter = new FakeAdapter()
    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare username: string

      @column.date({ autoCreate: true })
      declare dob: DateTime
    }

    const user = new User()
    User.$adapter = adapter
    adapter.on('insert', (_: LucidRow, attributes) => {
      assert.deepEqual(attributes, { username: 'virk', dob: DateTime.local().toISODate() })
    })

    user.username = 'virk'
    await user.save()
  })

  test('leave date untouched when it is defined as string', async ({ fs, assert }) => {
    assert.plan(1)

    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()

    const adapter = new FakeAdapter()
    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare username: string

      @column.date()
      declare dob: DateTime
    }

    const user = new User()
    User.$adapter = adapter
    adapter.on('insert', (_: LucidRow, attributes) => {
      assert.deepEqual(attributes, { username: 'virk', dob: '2010-11-20' })
    })

    user.username = 'virk'
    user.dob = '2010-11-20' as any
    await user.save()
  })

  test('do not attempt to format undefined values', async ({ fs, assert }) => {
    assert.plan(1)

    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()

    const adapter = new FakeAdapter()
    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare username: string

      @column.date()
      declare dob: DateTime
    }

    const user = new User()
    User.$adapter = adapter
    adapter.on('insert', (_: LucidRow, attributes) => {
      assert.deepEqual(attributes, { username: 'virk' })
    })

    user.username = 'virk'
    await user.save()
  })

  test('raise error when date column value is unprocessable', async ({ fs, assert }) => {
    assert.plan(2)

    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()

    const adapter = new FakeAdapter()
    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare username: string

      @column.date()
      declare dob: DateTime
    }

    const user = new User()
    User.$adapter = adapter

    user.username = 'virk'
    user.dob = 10 as any
    try {
      await user.save()
    } catch (error) {
      assert.instanceOf(error, errors.E_INVALID_DATE_COLUMN_VALUE)
      assert.equal(
        error.message,
        'Invalid value for "User.dob". The value must be an instance of "luxon.DateTime"'
      )
    }
  })

  test('raise error when datetime is invalid', async ({ fs, assert }) => {
    assert.plan(1)

    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()

    const adapter = new FakeAdapter()
    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare username: string

      @column.date()
      declare dob: DateTime
    }

    const user = new User()
    user.dob = DateTime.fromISO('hello-world')
    User.$adapter = adapter

    user.username = 'virk'
    try {
      await user.save()
    } catch ({ message }) {
      assert.equal(message, 'Invalid value for "User.dob". unparsable')
    }
  })

  test('allow overriding prepare method', async ({ fs, assert }) => {
    assert.plan(1)

    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()

    const adapter = new FakeAdapter()
    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare username: string

      @column.date({
        autoCreate: true,
        prepare: (value: DateTime) => value.toISOWeekDate(),
      })
      declare dob: DateTime
    }

    const user = new User()
    User.$adapter = adapter
    adapter.on('insert', (_, attributes) => {
      assert.deepEqual(attributes, { username: 'virk', dob: DateTime.local().toISOWeekDate() })
    })

    user.username = 'virk'
    await user.save()
  })

  test('convert date to datetime instance during fetch', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()

    const db = getDb()
    const adapter = ormAdapter(db)
    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare username: string

      @column.date()
      declare createdAt: DateTime
    }

    await db.insertQuery().table('users').insert({ username: 'virk' })
    const user = await User.find(1)
    assert.instanceOf(user!.createdAt, DateTime as any)
  })

  test('ignore null or empty values during fetch', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()

    const db = getDb()
    const adapter = ormAdapter(db)
    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare username: string

      @column.date()
      declare updatedAt: DateTime
    }

    await db.insertQuery().table('users').insert({ username: 'virk' })
    const user = await User.find(1)
    assert.isNull(user!.updatedAt)
  })

  test('convert date to toISODate during serialize', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()

    const db = getDb()
    const adapter = ormAdapter(db)
    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare username: string

      @column.date()
      declare createdAt: DateTime
    }

    await db.insertQuery().table('users').insert({
      username: 'virk',
      created_at: DateTime.local().toISODate(),
    })
    const user = await User.find(1)
    assert.match(user!.toJSON().createdAt, /\d{4}-\d{2}-\d{2}/)
  })

  test('do not attempt to serialize, when already a string', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()

    const db = getDb()
    const adapter = ormAdapter(db)
    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare username: string

      @column.date({
        consume: (value) =>
          typeof value === 'string'
            ? DateTime.fromSQL(value).minus({ days: 1 }).toISODate()
            : DateTime.fromJSDate(value).minus({ days: 1 }).toISODate(),
      })
      declare createdAt: DateTime
    }

    await db.insertQuery().table('users').insert({
      username: 'virk',
      created_at: DateTime.local().toISODate(),
    })
    const user = await User.find(1)
    assert.equal(user!.toJSON().createdAt, DateTime.local().minus({ days: 1 }).toISODate())
  })
})

test.group('Base Model | datetime', (group) => {
  group.setup(async () => {
    await setup()
  })

  group.teardown(async () => {
    await cleanupTables()
  })

  group.each.teardown(async () => {
    await resetTables()
  })

  test('define datetime column', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()

    const db = getDb()
    const adapter = ormAdapter(db)
    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare username: string

      @column.dateTime()
      declare dob: DateTime
    }

    assert.deepEqual(User.$getColumn('dob')!.meta, {
      autoCreate: false,
      autoUpdate: false,
      type: 'datetime',
    })
  })

  test('define datetime column and turn on autoCreate flag', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()

    const db = getDb()
    const adapter = ormAdapter(db)
    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare username: string

      @column.dateTime({ autoCreate: true })
      declare dob: DateTime
    }

    assert.deepEqual(User.$getColumn('dob')!.meta, {
      autoCreate: true,
      autoUpdate: false,
      type: 'datetime',
    })
  })

  test('define datetime column and turn on autoUpdate flag', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()

    const db = getDb()
    const adapter = ormAdapter(db)
    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare username: string

      @column.dateTime({ autoUpdate: true })
      declare dob: DateTime
    }

    assert.deepEqual(User.$getColumn('dob')!.meta, {
      autoCreate: false,
      autoUpdate: true,
      type: 'datetime',
    })
  })

  test('initiate datetime column values with current date when missing', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()

    const db = getDb()
    const adapter = ormAdapter(db)
    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare username: string

      @column.dateTime({ autoCreate: true })
      declare joinedAt: DateTime
    }

    const user = new User()
    user.username = 'virk'
    await user.save()
    assert.instanceOf(user.joinedAt, DateTime as any)

    const createdUser = await db.from('users').select('*').first()

    const clientDateFormat = User.query().client.dialect.dateTimeFormat
    const fetchedJoinedAt =
      createdUser.joined_at instanceof Date
        ? DateTime.fromJSDate(createdUser.joined_at)
        : DateTime.fromSQL(createdUser.joined_at)

    assert.equal(
      fetchedJoinedAt.toFormat(clientDateFormat),
      user.joinedAt.toFormat(clientDateFormat)
    )
  })

  test('ignore undefined values', async ({ fs, assert }) => {
    assert.plan(1)

    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()

    const adapter = new FakeAdapter()
    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare username: string

      @column.dateTime()
      declare dob: DateTime
    }

    const user = new User()
    User.$adapter = adapter
    adapter.on('insert', (_, attributes) => {
      assert.isUndefined(attributes.dob)
    })

    user.username = 'virk'
    await user.save()
  })

  test('ignore string values', async ({ fs, assert }) => {
    assert.plan(1)

    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()

    const adapter = new FakeAdapter()
    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare username: string

      @column.dateTime()
      declare dob: DateTime
    }

    const user = new User()
    User.$adapter = adapter
    adapter.on('insert', (_, attributes) => {
      assert.equal(attributes.dob, localTime)
    })

    const localTime = DateTime.local().toISO()
    user.username = 'virk'
    user.dob = localTime as any
    await user.save()
  })

  test('raise error when datetime column value is unprocessable', async ({ fs, assert }) => {
    assert.plan(2)

    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()

    const adapter = new FakeAdapter()
    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare username: string

      @column.dateTime()
      declare dob: DateTime
    }

    const user = new User()
    User.$adapter = adapter

    user.username = 'virk'
    user.dob = 10 as any
    try {
      await user.save()
    } catch (error) {
      assert.instanceOf(error, errors.E_INVALID_DATE_COLUMN_VALUE)
      assert.equal(
        error.message,
        'Invalid value for "User.dob". It must be an instance of "luxon.DateTime"'
      )
    }
  })

  test('allow overriding prepare method', async ({ fs, assert }) => {
    assert.plan(1)

    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()

    const adapter = new FakeAdapter()
    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare username: string

      @column.dateTime({
        autoCreate: true,
        prepare: (value: DateTime) => value.toISOWeekDate(),
      })
      declare dob: DateTime
    }

    const user = new User()
    User.$adapter = adapter
    adapter.on('insert', (_, attributes) => {
      assert.deepEqual(attributes, { username: 'virk', dob: DateTime.local().toISOWeekDate() })
    })

    user.username = 'virk'
    await user.save()
  })

  test('convert timestamp to datetime instance during fetch', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare username: string

      @column.dateTime()
      declare createdAt: DateTime
    }

    await db.insertQuery().table('users').insert({ username: 'virk' })
    const user = await User.find(1)
    assert.instanceOf(user!.createdAt, DateTime as any)
  })

  test('ignore null or empty values during fetch', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare username: string

      @column.dateTime()
      declare updatedAt: DateTime
    }

    await db.insertQuery().table('users').insert({ username: 'virk' })
    const user = await User.find(1)
    assert.isNull(user!.updatedAt)
  })

  test('always set datetime value when autoUpdate is true', async ({ fs, assert }) => {
    assert.plan(2)

    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const adapter = new FakeAdapter()

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare username: string

      @column.dateTime({ autoCreate: true, autoUpdate: true })
      declare joinedAt: DateTime
    }

    User.$adapter = adapter
    adapter.on('update', (_, attributes) => {
      assert.property(attributes, 'username')
      assert.property(attributes, 'joined_at')
    })

    const user = new User()
    user.username = 'virk'
    await user.save()

    // waiting for 2 ms, so that the updated at timestamp is different
    await new Promise((resolve) => setTimeout(resolve, 200))

    user.username = 'nikk'
    await user.save()
  })

  test('do not set autoUpdate field datetime when model is not dirty', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare username: string

      @column.dateTime({ autoCreate: true, autoUpdate: true })
      declare joinedAt: DateTime
    }

    const user = new User()
    user.username = 'virk'
    await user.save()

    const originalDateTimeString = user.joinedAt.toString()
    await user.save()
    assert.equal(originalDateTimeString, user.joinedAt.toString())
  })

  test('set datetime when model is dirty but after invoking a hook', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare username: string

      @column.dateTime({ autoCreate: true, autoUpdate: true })
      declare joinedAt: DateTime

      @beforeSave()
      static updateUserName(model: User) {
        if (!model.$isPersisted) {
          return
        }
        model.username = 'nikk'
      }
    }

    const user = new User()
    user.username = 'virk'
    await user.save()

    const originalDateTimeString = user.joinedAt.toString()

    await sleep(1000)
    await user.save()
    assert.notEqual(originalDateTimeString, user.joinedAt.toString())
  })

  test('convert datetime to toISO during serialize', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare username: string

      @column.dateTime()
      declare joinedAt: DateTime
    }

    await db
      .insertQuery()
      .table('users')
      .insert({
        username: 'virk',
        joined_at: DateTime.local().toFormat(db.connection().dialect.dateTimeFormat),
      })

    const user = await User.find(1)
    assert.match(
      user!.toJSON().joinedAt,
      /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}(\+|\-)\d{2}:\d{2}/
    )
  })

  test('do not attempt to serialize, when already a string', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare username: string

      @column.dateTime({
        consume: (value) =>
          typeof value === 'string'
            ? DateTime.fromSQL(value).minus({ days: 1 }).toISODate()
            : DateTime.fromJSDate(value).minus({ days: 1 }).toISODate(),
      })
      declare joinedAt: DateTime
    }

    await db
      .insertQuery()
      .table('users')
      .insert({
        username: 'virk',
        joined_at: DateTime.local().toFormat(db.connection().dialect.dateTimeFormat),
      })

    const user = await User.find(1)
    assert.equal(user!.toJSON().joinedAt, DateTime.local().minus({ days: 1 }).toISODate())
  })

  test('force update when enabledForceUpdate method is called', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare username: string

      @column.dateTime({ autoCreate: true, autoUpdate: true })
      declare joinedAt: DateTime
    }

    const user = new User()
    user.username = 'virk'
    await user.save()

    const originalDateTimeString = user.joinedAt.toString()

    await sleep(1000)
    await user.enableForceUpdate().save()
    assert.notEqual(originalDateTimeString, user.joinedAt.toString())
  })

  test('force update when enabledForceUpdate method and there are no timestamps', async ({
    assert,
    fs,
  }) => {
    assert.plan(1)

    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare username: string

      @afterUpdate()
      static afterHook(user: User) {
        assert.instanceOf(user, User)
      }
    }

    const user = new User()
    user.username = 'virk'
    await user.save()

    await user.enableForceUpdate().save()
  })
})

test.group('Base Model | paginate', (group) => {
  group.setup(async () => {
    await setup()
  })

  group.teardown(async () => {
    await cleanupTables()
  })

  group.each.teardown(async () => {
    await resetTables()
  })

  test('paginate through rows', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare username: string

      @column()
      declare email: string
    }

    await db.insertQuery().table('users').multiInsert(getUsers(18))
    const users = await User.query().paginate(1, 5)
    users.baseUrl('/users')

    assert.instanceOf(users, ModelPaginator)

    assert.lengthOf(users.all(), 5)
    assert.instanceOf(users.all()[0], User)
    assert.equal(users.perPage, 5)
    assert.equal(users.currentPage, 1)
    assert.equal(users.lastPage, 4)
    assert.isTrue(users.hasPages)
    assert.isTrue(users.hasMorePages)
    assert.isFalse(users.isEmpty)
    assert.equal(users.total, 18)
    assert.isTrue(users.hasTotal)
    assert.deepEqual(users.getMeta(), {
      total: 18,
      perPage: 5,
      currentPage: 1,
      lastPage: 4,
      firstPage: 1,
      firstPageUrl: '/users?page=1',
      lastPageUrl: '/users?page=4',
      nextPageUrl: '/users?page=2',
      previousPageUrl: null,
    })
  })

  test('serialize from model paginator', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare username: string

      @column()
      declare email: string
    }

    await db.insertQuery().table('users').multiInsert(getUsers(18))
    const users = await User.query().paginate(1, 5)
    users.baseUrl('/users')

    assert.instanceOf(users, ModelPaginator)
    const { meta, data } = users.serialize({
      fields: ['username'],
    })

    data.forEach((row) => {
      assert.notProperty(row, 'email')
      assert.notProperty(row, 'id')
    })
    assert.deepEqual(meta, {
      total: 18,
      perPage: 5,
      currentPage: 1,
      lastPage: 4,
      firstPage: 1,
      firstPageUrl: '/users?page=1',
      lastPageUrl: '/users?page=4',
      nextPageUrl: '/users?page=2',
      previousPageUrl: null,
    })
  })

  test('return simple paginator instance when using pojo', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare username: string

      @column()
      declare email: string
    }

    await db.insertQuery().table('users').multiInsert(getUsers(18))
    const users = await User.query().pojo().paginate(1, 5)
    users.baseUrl('/users')

    assert.instanceOf(users, SimplePaginator)

    assert.lengthOf(users.all(), 5)
    assert.notInstanceOf(users.all()[0], User)
    assert.equal(users.perPage, 5)
    assert.equal(users.currentPage, 1)
    assert.equal(users.lastPage, 4)
    assert.isTrue(users.hasPages)
    assert.isTrue(users.hasMorePages)
    assert.isFalse(users.isEmpty)
    assert.equal(users.total, 18)
    assert.isTrue(users.hasTotal)
    assert.deepEqual(users.getMeta(), {
      total: 18,
      perPage: 5,
      currentPage: 1,
      lastPage: 4,
      firstPage: 1,
      firstPageUrl: '/users?page=1',
      lastPageUrl: '/users?page=4',
      nextPageUrl: '/users?page=2',
      previousPageUrl: null,
    })
  })

  test('use model naming strategy for pagination properties', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare username: string

      @column()
      declare email: string
    }

    User.namingStrategy = new SnakeCaseNamingStrategy()
    User.namingStrategy.paginationMetaKeys = () => {
      return {
        total: 'total',
        perPage: 'perPage',
        currentPage: 'currentPage',
        lastPage: 'lastPage',
        firstPage: 'firstPage',
        firstPageUrl: 'firstPageUrl',
        lastPageUrl: 'lastPageUrl',
        nextPageUrl: 'nextPageUrl',
        previousPageUrl: 'previousPageUrl',
      }
    }

    await db.insertQuery().table('users').multiInsert(getUsers(18))
    const users = await User.query().paginate(1, 5)
    users.baseUrl('/users')

    assert.lengthOf(users.all(), 5)
    assert.instanceOf(users.all()[0], User)
    assert.equal(users.perPage, 5)
    assert.equal(users.currentPage, 1)
    assert.equal(users.lastPage, 4)
    assert.isTrue(users.hasPages)
    assert.isTrue(users.hasMorePages)
    assert.isFalse(users.isEmpty)
    assert.equal(users.total, 18)
    assert.isTrue(users.hasTotal)
    assert.deepEqual(users.getMeta(), {
      total: 18,
      perPage: 5,
      currentPage: 1,
      lastPage: 4,
      firstPage: 1,
      firstPageUrl: '/users?page=1',
      lastPageUrl: '/users?page=4',
      nextPageUrl: '/users?page=2',
      previousPageUrl: null,
    })
  })

  test('use table aliases', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare username: string

      @column()
      declare email: string
    }

    const usersList = getUsers(18)
    await db.insertQuery().table('users').multiInsert(usersList)

    const users = await User.query()
      .from({ u: User.table })
      .where('u.username', usersList[0].username)
      .paginate(1, 5)

    users.baseUrl('/users')

    assert.instanceOf(users, ModelPaginator)

    assert.lengthOf(users.all(), 1)
    assert.instanceOf(users.all()[0], User)
    assert.equal(users.perPage, 5)
    assert.equal(users.currentPage, 1)
    assert.equal(users.lastPage, 1)
    assert.isFalse(users.hasPages)
    assert.isFalse(users.hasMorePages)
    assert.isFalse(users.isEmpty)
    assert.equal(users.total, 1)
    assert.isTrue(users.hasTotal)
    assert.deepEqual(users.getMeta(), {
      total: 1,
      perPage: 5,
      currentPage: 1,
      lastPage: 1,
      firstPage: 1,
      firstPageUrl: '/users?page=1',
      lastPageUrl: '/users?page=1',
      nextPageUrl: null,
      previousPageUrl: null,
    })
  })
})

test.group('Base Model | toObject', (group) => {
  group.setup(async () => {
    await setup()
  })

  group.teardown(async () => {
    await cleanupTables()
  })

  test('convert model to its object representation', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column()
      declare username: string
    }

    const user = new User()
    user.username = 'virk'

    assert.deepEqual(user.toObject(), { username: 'virk', $extras: {} })
  })

  test('use model property key when converting model to object', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ serializeAs: 'theUserName', columnName: 'user_name' })
      declare username: string
    }

    const user = new User()
    user.username = 'virk'

    assert.deepEqual(user.toObject(), { username: 'virk', $extras: {} })
  })

  test('add computed properties to toObject result', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column()
      declare username: string

      @computed()
      get fullName() {
        return this.username.toUpperCase()
      }
    }

    const user = new User()
    user.username = 'virk'

    assert.deepEqual(user.toObject(), { username: 'virk', fullName: 'VIRK', $extras: {} })
  })

  test('do not add computed property when it returns undefined', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column()
      declare username: string

      @computed()
      get fullName() {
        return undefined
      }
    }

    const user = new User()
    user.username = 'virk'

    assert.deepEqual(user.toObject(), { username: 'virk', $extras: {} })
  })

  test('add preloaded hasOne relationship to toObject result', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    class Profile extends BaseModel {
      @column()
      declare username: string

      @column()
      declare userId: number
    }

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare username: string

      @hasOne(() => Profile)
      declare profile: HasOne<typeof Profile>
    }

    const user = new User()
    user.username = 'virk'
    user.$setRelated('profile', new Profile())

    assert.deepEqual(user.toObject(), {
      username: 'virk',
      profile: {
        $extras: {},
      },
      $extras: {},
    })
  })

  test('add preloaded hasMany relationship to toObject result', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    class Comment extends BaseModel {
      @column()
      declare body: string

      @column()
      declare postId: number
    }

    class Post extends BaseModel {
      @column()
      declare title: string

      @column()
      declare userId: number

      @hasMany(() => Comment)
      declare comments: HasMany<typeof Comment>
    }

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare username: string

      @hasMany(() => Post)
      declare posts: HasMany<typeof Post>
    }

    const user = new User()
    user.username = 'virk'

    const post = new Post()
    post.title = 'Adonis 101'

    const comment = new Comment()
    comment.body = 'Nice post'

    post.$setRelated('comments', [comment])
    user.$setRelated('posts', [post])

    assert.deepEqual(user.toObject(), {
      username: 'virk',
      posts: [
        {
          title: 'Adonis 101',
          comments: [
            {
              body: 'Nice post',
              $extras: {},
            },
          ],
          $extras: {},
        },
      ],
      $extras: {},
    })
  })
})

test.group('Base model | inheritance', (group) => {
  group.setup(async () => {
    await setup()
  })

  group.teardown(async () => {
    await cleanupTables()
  })

  test('inherit primary key from the base model', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    class MyBaseModel extends BaseModel {
      static primaryKey = 'user_id'
    }

    class User extends MyBaseModel {
      @column()
      declare username: string

      @column()
      declare age: number
    }

    MyBaseModel.boot()
    User.boot()

    assert.equal(User.primaryKey, 'user_id')
  })

  test('use explicitly defined primary key', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    class MyBaseModel extends BaseModel {
      static primaryKey = 'user_id'
    }

    class User extends MyBaseModel {
      static primaryKey = 'the_user_id'

      @column()
      declare username: string

      @column()
      declare age: number
    }

    MyBaseModel.boot()
    User.boot()

    assert.equal(User.primaryKey, 'the_user_id')
  })

  test('do not inherit table from the base model', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    class MyBaseModel extends BaseModel {
      static table = 'foo'
    }

    class User extends MyBaseModel {
      @column()
      declare username: string

      @column()
      declare age: number
    }

    MyBaseModel.boot()
    User.boot()

    assert.equal(User.table, 'users')
  })

  test('inherting a model should copy columns', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    class MyBaseModel extends BaseModel {
      @column({ isPrimary: true })
      declare id: number
    }

    class User extends MyBaseModel {
      @column()
      declare username: string

      @column()
      declare age: number
    }

    MyBaseModel.boot()
    User.boot()

    assert.deepEqual(
      User.$columnsDefinitions,
      new Map([
        [
          'age',
          {
            columnName: 'age',
            consume: undefined,
            hasGetter: false,
            hasSetter: false,
            isPrimary: false,
            meta: undefined,
            prepare: undefined,
            serialize: undefined,
            serializeAs: 'age',
          },
        ],
        [
          'id',
          {
            columnName: 'id',
            consume: undefined,
            hasGetter: false,
            hasSetter: false,
            isPrimary: true,
            meta: undefined,
            prepare: undefined,
            serialize: undefined,
            serializeAs: 'id',
          },
        ],
        [
          'username',
          {
            columnName: 'username',
            consume: undefined,
            hasGetter: false,
            hasSetter: false,
            isPrimary: false,
            meta: undefined,
            prepare: undefined,
            serialize: undefined,
            serializeAs: 'username',
          },
        ],
      ])
    )

    assert.deepEqual(User.$keys.attributesToColumns.all(), {
      age: 'age',
      id: 'id',
      username: 'username',
    })

    assert.deepEqual(
      MyBaseModel.$columnsDefinitions,
      new Map([
        [
          'id',
          {
            columnName: 'id',
            consume: undefined,
            hasGetter: false,
            hasSetter: false,
            isPrimary: true,
            meta: undefined,
            prepare: undefined,
            serialize: undefined,
            serializeAs: 'id',
          },
        ],
      ])
    )

    assert.deepEqual(MyBaseModel.$keys.attributesToColumns.all(), {
      id: 'id',
    })
  })

  test('allow overwriting column', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    class MyBaseModel extends BaseModel {
      @column({ isPrimary: true })
      declare userId: string
    }

    class User extends MyBaseModel {
      @column({ isPrimary: true, columnName: 'user_uuid' })
      declare userId: string

      @column()
      declare username: string

      @column()
      declare age: number
    }

    MyBaseModel.boot()
    User.boot()

    assert.deepEqual(
      User.$columnsDefinitions,
      new Map([
        [
          'age',
          {
            columnName: 'age',
            consume: undefined,
            hasGetter: false,
            hasSetter: false,
            isPrimary: false,
            meta: undefined,
            prepare: undefined,
            serialize: undefined,
            serializeAs: 'age',
          },
        ],
        [
          'userId',
          {
            columnName: 'user_uuid',
            consume: undefined,
            hasGetter: false,
            hasSetter: false,
            isPrimary: true,
            meta: undefined,
            prepare: undefined,
            serialize: undefined,
            serializeAs: 'userId',
          },
        ],
        [
          'username',
          {
            columnName: 'username',
            consume: undefined,
            hasGetter: false,
            hasSetter: false,
            isPrimary: false,
            meta: undefined,
            prepare: undefined,
            serialize: undefined,
            serializeAs: 'username',
          },
        ],
      ])
    )

    assert.deepEqual(User.$keys.attributesToColumns.all(), {
      age: 'age',
      userId: 'user_uuid',
      username: 'username',
    })

    assert.deepEqual(
      MyBaseModel.$columnsDefinitions,
      new Map([
        [
          'userId',
          {
            columnName: 'user_id',
            consume: undefined,
            hasGetter: false,
            hasSetter: false,
            isPrimary: true,
            meta: undefined,
            prepare: undefined,
            serialize: undefined,
            serializeAs: 'userId',
          },
        ],
      ])
    )

    assert.deepEqual(MyBaseModel.$keys.attributesToColumns.all(), {
      userId: 'user_id',
    })
  })

  test('inherting a model should copy computed properties', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    class MyBaseModel extends BaseModel {
      @computed()
      declare fullName: string
    }

    class User extends MyBaseModel {
      @column()
      declare username: string

      @column()
      declare age: number

      @computed()
      declare score: number
    }

    MyBaseModel.boot()
    User.boot()

    assert.deepEqual(
      User.$columnsDefinitions,
      new Map([
        [
          'age',
          {
            columnName: 'age',
            consume: undefined,
            hasGetter: false,
            hasSetter: false,
            isPrimary: false,
            meta: undefined,
            prepare: undefined,
            serialize: undefined,
            serializeAs: 'age',
          },
        ],
        [
          'username',
          {
            columnName: 'username',
            consume: undefined,
            hasGetter: false,
            hasSetter: false,
            isPrimary: false,
            meta: undefined,
            prepare: undefined,
            serialize: undefined,
            serializeAs: 'username',
          },
        ],
      ])
    )

    assert.deepEqual(
      User.$computedDefinitions,
      new Map([
        [
          'fullName',
          {
            meta: undefined,
            serializeAs: 'fullName',
          },
        ],
        [
          'score',
          {
            meta: undefined,
            serializeAs: 'score',
          },
        ],
      ])
    )

    assert.deepEqual(User.$keys.attributesToColumns.all(), {
      age: 'age',
      username: 'username',
    })

    assert.deepEqual(MyBaseModel.$columnsDefinitions, new Map([]))
    assert.deepEqual(
      MyBaseModel.$computedDefinitions,
      new Map([
        [
          'fullName',
          {
            meta: undefined,
            serializeAs: 'fullName',
          },
        ],
      ])
    )
    assert.deepEqual(MyBaseModel.$keys.attributesToColumns.all(), {})
  })

  test('allow overwriting computed properties', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    class MyBaseModel extends BaseModel {
      @computed()
      declare fullName: string
    }

    class User extends MyBaseModel {
      @column()
      declare username: string

      @column()
      declare age: number

      @computed({ serializeAs: 'name' })
      declare fullName: string
    }

    MyBaseModel.boot()
    User.boot()

    assert.deepEqual(
      User.$columnsDefinitions,
      new Map([
        [
          'age',
          {
            columnName: 'age',
            consume: undefined,
            hasGetter: false,
            hasSetter: false,
            isPrimary: false,
            meta: undefined,
            prepare: undefined,
            serialize: undefined,
            serializeAs: 'age',
          },
        ],
        [
          'username',
          {
            columnName: 'username',
            consume: undefined,
            hasGetter: false,
            hasSetter: false,
            isPrimary: false,
            meta: undefined,
            prepare: undefined,
            serialize: undefined,
            serializeAs: 'username',
          },
        ],
      ])
    )

    assert.deepEqual(
      User.$computedDefinitions,
      new Map([
        [
          'fullName',
          {
            meta: undefined,
            serializeAs: 'name',
          },
        ],
      ])
    )

    assert.deepEqual(User.$keys.attributesToColumns.all(), {
      age: 'age',
      username: 'username',
    })

    assert.deepEqual(MyBaseModel.$columnsDefinitions, new Map([]))
    assert.deepEqual(
      MyBaseModel.$computedDefinitions,
      new Map([
        [
          'fullName',
          {
            meta: undefined,
            serializeAs: 'fullName',
          },
        ],
      ])
    )
    assert.deepEqual(MyBaseModel.$keys.attributesToColumns.all(), {})
  })

  test('inherting a model should copy relationships', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    class Profile extends BaseModel {
      @column()
      declare userId: number
    }
    class Email extends BaseModel {
      @column()
      declare userId: number
    }

    Profile.boot()
    Email.boot()

    class MyBaseModel extends BaseModel {
      @column()
      declare id: number

      @hasOne(() => Profile)
      declare profile: HasOne<typeof Profile>
    }

    class User extends MyBaseModel {
      @hasMany(() => Email)
      declare emails: HasMany<typeof Email>
    }

    MyBaseModel.boot()
    User.boot()

    assert.isTrue(User.$relationsDefinitions.has('emails'))
    assert.isTrue(User.$relationsDefinitions.has('profile'))
    assert.isTrue(MyBaseModel.$relationsDefinitions.has('profile'))
    assert.isFalse(MyBaseModel.$relationsDefinitions.has('emails'))
  })

  test('overwrite relationship during relationsip', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    class SocialProfile extends BaseModel {
      @column()
      declare socialParentId: number

      @column()
      declare userId: number
    }

    class Profile extends BaseModel {
      @column()
      declare userId: number
    }

    class Email extends BaseModel {
      @column()
      declare userId: number
    }

    SocialProfile.boot()
    Profile.boot()
    Email.boot()

    class MyBaseModel extends BaseModel {
      @column()
      declare id: number

      @hasOne(() => Profile)
      declare profile: HasOne<typeof Profile>
    }

    class User extends MyBaseModel {
      @hasMany(() => Email)
      declare emails: HasMany<typeof Email>

      @hasOne(() => SocialProfile, { foreignKey: 'socialParentId' })
      declare profile: HasOne<typeof SocialProfile>
    }

    MyBaseModel.boot()
    User.boot()

    assert.deepEqual(User.$getRelation('profile').relatedModel(), SocialProfile)
    assert.deepEqual(User.$getRelation('profile').model, User)

    assert.deepEqual(MyBaseModel.$getRelation('profile').relatedModel(), Profile)
    assert.deepEqual(MyBaseModel.$getRelation('profile').model, MyBaseModel)
  })

  test('allow overwriting relationships', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    class Profile extends BaseModel {
      @column()
      declare userId: number
    }

    class Email extends BaseModel {
      @column()
      declare userId: number
    }

    Profile.boot()
    Email.boot()

    class MyBaseModel extends BaseModel {
      @column()
      declare id: number

      @hasOne(() => Profile)
      declare profile: HasOne<typeof Profile>
    }

    class User extends MyBaseModel {
      @hasOne(() => Profile, {
        onQuery() {},
      })
      declare profile: HasOne<typeof Profile>

      @hasMany(() => Email)
      declare emails: HasMany<typeof Email>
    }

    MyBaseModel.boot()
    User.boot()

    assert.isTrue(User.$relationsDefinitions.has('emails'))
    assert.isTrue(User.$relationsDefinitions.has('profile'))
    assert.isTrue(MyBaseModel.$relationsDefinitions.has('profile'))
    assert.isFalse(MyBaseModel.$relationsDefinitions.has('emails'))
    assert.isFunction((User.$relationsDefinitions.get('profile') as any)['onQueryHook'])
    assert.isUndefined((MyBaseModel.$relationsDefinitions.get('profile') as any)['onQueryHook'])
  })

  test('inherting a model should copy hooks', async ({ fs, assert }) => {
    function hook1() {}
    function hook2() {}

    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = getDb()
    const adapter = ormAdapter(db)
    const BaseModel = getBaseModel(adapter)

    class MyBaseModel extends BaseModel {
      static boot() {
        const isBooted = MyBaseModel.hasOwnProperty('booted') && MyBaseModel.booted === true
        super.boot()

        if (!isBooted) {
          this.before('create', hook1)
        }
      }
    }

    class User extends MyBaseModel {
      static boot() {
        super.boot()
        this.before('create', hook2)
      }
    }

    MyBaseModel.boot()
    User.boot()

    assert.isTrue(User.$hooks.has('before:create', hook1))
    assert.isTrue(User.$hooks.has('before:create', hook2))
    assert.isTrue(MyBaseModel.$hooks.has('before:create', hook1))
    assert.isFalse(MyBaseModel.$hooks.has('before:create', hook2))
  })
})

test.group('Base Model | lockForUpdate', (group) => {
  group.setup(async () => {
    await setup()
  })

  group.teardown(async () => {
    await cleanupTables()
  })

  group.each.teardown(async () => {
    await resetTables()
  })

  test('lock model row for update', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare username: string

      @column()
      declare email: string

      @column()
      declare points: number
    }

    const user = await User.create({ email: 'foo@bar.com', username: 'virk', points: 0 })
    await Promise.all([
      user.lockForUpdate(async (freshUser) => {
        freshUser.points = freshUser.points + 1
        await freshUser.save()
      }),
      user.lockForUpdate(async (freshUser) => {
        freshUser.points = freshUser.points + 1
        await freshUser.save()
      }),
    ])

    await user.refresh()
    assert.equal(user.points, 2)
  })

  test('re-use initial model transaction', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare username: string

      @column()
      declare email: string

      @column()
      declare points: number
    }

    const user = await User.create({ email: 'foo@bar.com', username: 'virk', points: 0 })
    const trx = await db.transaction()
    user.useTransaction(trx)

    await Promise.all([
      user.lockForUpdate(async (freshUser) => {
        freshUser.points = freshUser.points + 1
        await freshUser.save()
      }),
      user.lockForUpdate(async (freshUser) => {
        freshUser.points = freshUser.points + 1
        await freshUser.save()
      }),
    ])

    assert.isFalse(trx.isCompleted)
    await trx.rollback()

    await user.refresh()
    assert.equal(user.points, 0)
  })

  test('throw error when row is missing', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare username: string

      @column()
      declare email: string

      @column()
      declare points: number
    }

    const user = await User.create({ email: 'foo@bar.com', username: 'virk', points: 0 })
    await user.delete()
    await assert.rejects(() =>
      user.lockForUpdate(async (freshUser) => {
        freshUser.points = freshUser.points + 1
        await freshUser.save()
      })
    )
  })
})

test.group('Base Model | transaction', (group) => {
  group.setup(async () => {
    await setup()
  })

  group.teardown(async () => {
    await cleanupTables()
  })

  group.each.teardown(async () => {
    await resetTables()
  })

  test('create transaction client using model', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare username: string

      @column()
      declare email: string
    }

    const client = await User.transaction()
    await client.insertQuery().table('users').insert({ username: 'virk' })
    await client.rollback()
    const user = await User.find(1)

    assert.isNull(user)
  })

  test('auto manage transaction when callback is provided', async ({ fs, assert }) => {
    const app = new AppFactory().create(fs.baseUrl, () => {})
    await app.init()
    const db = getDb()
    const adapter = ormAdapter(db)

    const BaseModel = getBaseModel(adapter)

    class User extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare username: string

      @column()
      declare email: string
    }

    await User.transaction(async (trx) => {
      return trx.insertQuery().table('users').insert({ username: 'virk' }).returning('id')
    })
    const user = await User.find(1)
    assert.equal(user!.username, 'virk')
  })
})
