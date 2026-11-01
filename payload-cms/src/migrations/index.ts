import * as migration_20261031_161800 from './20261031_161800_auth_reset_requested_at';
import * as migration_20261101_072600 from './20261101_072600_media_objectkey';
import * as migration_20260729_060159_initial_tungphat_cms from './20260729_060159_initial_tungphat_cms';
import * as migration_20260817_043343 from './20260817_043343';
import * as migration_20260817_061836 from './20260817_061836';
import * as migration_20260817_063013 from './20260817_063013';
import * as migration_20260817_071330 from './20260817_071330';

export const migrations = [
  {
    up: migration_20260729_060159_initial_tungphat_cms.up,
    down: migration_20260729_060159_initial_tungphat_cms.down,
    name: '20260729_060159_initial_tungphat_cms',
  },
  {
    up: migration_20260817_043343.up,
    down: migration_20260817_043343.down,
    name: '20260817_043343',
  },
  {
    up: migration_20260817_061836.up,
    down: migration_20260817_061836.down,
    name: '20260817_061836',
  },
  {
    up: migration_20260817_063013.up,
    down: migration_20260817_063013.down,
    name: '20260817_063013',
  },
  {
    up: migration_20260817_071330.up,
    down: migration_20260817_071330.down,
    name: '20260817_071330'
  },
  { up: migration_20261031_161800.up, down: migration_20261031_161800.down, name: '20261031_161800_auth_reset_requested_at' },
  { up: migration_20261101_072600.up, down: migration_20261101_072600.down, name: '20261101_072600_media_objectkey' },
];
