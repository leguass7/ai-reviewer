# Folder Structure

## Backend

```
├── docs
├── volumes
├── src
│ ├── @types
│ ├── config
│ ├── database
│ ├── helpers
│ ├── services
│ ├── useCases
│ │ ├── group
│ │ ├── user
│ │ │ ├── user.controller.ts
│ │ │ ├── user.dto.ts
│ │ │ ├── user.entity.ts
│ │ │ ├── user.middleware.ts
│ │ │ ├── user.route.ts
│ │ │ ├── user.service.ts
│ │ │ ├── user.validation.ts
│ │ │ └── index.ts
│ │ ├── user-group
│ │ └── index.ts
│ └── index.ts
├── .gitignore
├── README.md
└── package.json

```

### Route file for User

**_Example:_**

```typescript
// file: user.route.ts
import { Router } from 'express';

import { cacheService } from '#/useCases/cache.service';
import { dataSource } from '#/useCases/datasource.service';
import { paginateService } from '#/useCases/paginate.service';
import { volumeDataService } from '#/useCases/volume-data.service';

import { UserController } from './user.controller';
import { UserDownloadService } from './user.download.service';
import { UserService } from './user.service';

const userService = new UserService(dataSource, paginateService, cacheService);
const userDownloadService = new UserDownloadService(volumeDataService);
const controller = new UserController(userService);

const UserRoute = Router();

UserRoute.get('/', (...n) => controller.temp(...n));

export { UserRoute, userService, userDownloadService };
```

### Controller file for User

**_Example:_**

```typescript
// file: user.controller.ts
import type { Request, Response, NextFunction } from 'express';
import { Catch } from '#/services/HttpServer/exceptions/catch-controller.decorator';
import type { UserService } from './user.service';

@Catch()
export class UserController {
  constructor(private readonly userService: UserService) {}

  async temp(req: Request, res: Response, next: NextFunction) {
    const data = await this.userService.getData();
    return res.status(200).json(data);
  }
}
```
