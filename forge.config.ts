import type { ForgeConfig } from '@electron-forge/shared-types'
import { MakerSquirrel } from '@electron-forge/maker-squirrel'
import { MakerZIP } from '@electron-forge/maker-zip'
import { MakerDeb } from '@electron-forge/maker-deb'
import { MakerRpm } from '@electron-forge/maker-rpm'

const config: ForgeConfig = {
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
    }
  },
  rebuildConfig: {},
  makers: [
    new MakerSquirrel({
      name: 'MetaLogic',
      setupIcon: './assets/icon.ico'
    }),
    new MakerZIP({}, ['darwin']),
    new MakerDeb({
      options: {
        name: 'metalogic',
        productName: 'MetaLogic',
        genericName: 'Digital Logic Simulator',
        categories: ['Education', 'Science'],
        icon: './assets/icon.png'
      }
    }),
    new MakerRpm({
      options: {
        name: 'metalogic',
        productName: 'MetaLogic',
        genericName: 'Digital Logic Simulator',
        categories: ['Education', 'Science'],
        icon: './assets/icon.png'
      }
    })
  ]
}

export default config
