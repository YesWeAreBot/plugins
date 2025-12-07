import { Database } from '@yesimbot/minato'
import PostgresDriver from '@yesimbot/driver-pglite'
import Logger from 'reggol'
import test from '@yesimbot/minato-tests'

const logger = new Logger('pglite')

describe('@yesimbot/driver-pglite', () => {
  const database = new Database()

  before(async () => {
    logger.level = 3
    await database.connect(PostgresDriver, {
      dataDir: 'memory://',
    })
  })

  after(async () => {
    await database.dropAll()
    await database.stopAll()
    logger.level = 2
  })

  test(database, {
    query: {
      list: {
        elementQuery: false,
      },
    },
  })
})
