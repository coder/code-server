### A base TSConfig for working with Node 10.

Add the package to your `"devDependencies"`:

```sh
npm install --save-dev @tsconfig/node10
yarn add --dev @tsconfig/node10
```

Add to your `tsconfig.json`:

```json
"extends": "@tsconfig/node10/tsconfig.json"
```

---

The `tsconfig.json`: 

```jsonc
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "display": "Node 10",
  
  "compilerOptions": {
    "lib": ["es2018"],
    "module": "commonjs",
    "target": "es2018",
    
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }  
}

```
