import type { ForgeConfig } from '@electron-forge/shared-types'
import { MakerSquirrel } from '@electron-forge/maker-squirrel'
import { MakerZIP } from '@electron-forge/maker-zip'
import { MakerDeb } from '@electron-forge/maker-deb'
import { MakerRpm } from '@electron-forge/maker-rpm'
import { execSync } from 'child_process'

const config: ForgeConfig = {
  // Avoid colliding with electron-vite's "out/" build directory
  outDir: 'dist',
  packagerConfig: {
    name: 'MetaLogic',
    executableName: 'metalogic',
    icon: './assets/icon',
    asar: true,
    appBundleId: 'com.metalogic.app',
    appCategoryType: 'public.app-category.education',
    win32metadata: {
      CompanyName: 'MetaLogic',
      FileDescription: 'Digital Logic Simulator',
      ProductName: 'MetaLogic'
    },
    ignore: (path: string) => {
      // Don't ignore empty path (root)
      if (!path) return false
      // Always include package.json and out/ (electron-vite build output)
      if (path === '/package.json') return false
      if (path.startsWith('/out')) return false
      // Always include node_modules (needed for runtime deps)
      if (path.startsWith('/node_modules')) return false
      // Ignore everything else (src, config files, etc.)
      return true
    }
  },
  hooks: {
    generateAssets: async () => {
      execSync('npx electron-vite build', { stdio: 'inherit' })
    }
  },
  rebuildConfig: {},
  makers: [
    new MakerSquirrel({
      name: 'MetaLogic',
      authors: 'Isaac Lloyd',
      setupIcon: './assets/icon.ico'
    }),
    new MakerZIP({}, ['darwin']),
    new MakerDeb(
      {
        options: {
          name: 'metalogic',
          productName: 'MetaLogic',
          genericName: 'Digital Logic Simulator',
          categories: ['Education', 'Science'],
          icon: './assets/icon.png'
        }
      },
      ['linux']
    ),
    new MakerRpm(
      {
        options: {
          name: 'metalogic',
          productName: 'MetaLogic',
          genericName: 'Digital Logic Simulator',
          license: 'MIT',
          categories: ['Education', 'Science'],
          icon: './assets/icon.png'
        }
      },
      ['linux']
    )
  ]
}

export default config
