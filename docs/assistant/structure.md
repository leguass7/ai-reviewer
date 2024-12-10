# Folder Structure (structure.md)

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

### Allowed code patterns

**_Example:_**

O padrão do projeto permite lançar exceções personalizadas, que são capturadas pelo middleware de exceções e tratadas de acordo com o status e a mensagem definidos.

```typescript
  // ...
  const resourceFound = await this.anyService.getOne(+id);
  if (!resourceFound) throw new HttpException(400, ErrMsg.noFound);
  // ...
```

O padrão do projeto permite utilizar `.end()` ao final do método `res.status().send()`.

```typescript
  // ...
  const { id } = params;
  const result = await this.anyService.getOne(+id);
  return res.status(200).send({ resourceName: result, success: !!result }).end();
  // ...
```

O padrão do projeto permite conversão explícita, pois há middleware de exceção que captura erros de validação e converte para um erro de validação personalizado.

```typescript
  // ...
    async anyMethod(req: Request, res: Response, _next: NextFunction) {
    const { params } = req;
    const pitchId = +params?.pitchId;
  // ...
```


---

## Frontend

**_Example:_** desestruturação permitida

```typescript
export const ComponentExample: React.FC = () => {
  const [data, requestData, , loading] = useCustomHook();
  //...
};
```
