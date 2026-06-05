#!/usr/bin/env node
import { run as init } from './commands/init.mjs'
import { run as sync } from './commands/sync.mjs'
import { run as doctor } from './commands/doctor.mjs'
import { run as migrate } from './commands/migrate.mjs'

const [,, cmd, ...args] = process.argv
const commands = { init, sync, doctor, migrate }

if (!cmd || !commands[cmd]) {
  console.error(`Usage: framework <init|sync|doctor>`)
  process.exit(1)
}

commands[cmd](args).catch(err => {
  console.error(`framework ${cmd}: ${err.message}`)
  process.exit(1)
})
