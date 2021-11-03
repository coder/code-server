'use strict';Object.defineProperty(exports, "__esModule", { value: true });const rules = exports.rules = {
  'no-unresolved': require('./rules/no-unresolved'),
  'named': require('./rules/named'),
  'default': require('./rules/default'),
  'namespace': require('./rules/namespace'),
  'no-namespace': require('./rules/no-namespace'),
  'export': require('./rules/export'),
  'no-mutable-exports': require('./rules/no-mutable-exports'),
  'extensions': require('./rules/extensions'),
  'no-restricted-paths': require('./rules/no-restricted-paths'),
  'no-internal-modules': require('./rules/no-internal-modules'),
  'group-exports': require('./rules/group-exports'),
  'no-relative-packages': require('./rules/no-relative-packages'),
  'no-relative-parent-imports': require('./rules/no-relative-parent-imports'),

  'no-self-import': require('./rules/no-self-import'),
  'no-cycle': require('./rules/no-cycle'),
  'no-named-default': require('./rules/no-named-default'),
  'no-named-as-default': require('./rules/no-named-as-default'),
  'no-named-as-default-member': require('./rules/no-named-as-default-member'),
  'no-anonymous-default-export': require('./rules/no-anonymous-default-export'),
  'no-unused-modules': require('./rules/no-unused-modules'),

  'no-commonjs': require('./rules/no-commonjs'),
  'no-amd': require('./rules/no-amd'),
  'no-duplicates': require('./rules/no-duplicates'),
  'first': require('./rules/first'),
  'max-dependencies': require('./rules/max-dependencies'),
  'no-extraneous-dependencies': require('./rules/no-extraneous-dependencies'),
  'no-absolute-path': require('./rules/no-absolute-path'),
  'no-nodejs-modules': require('./rules/no-nodejs-modules'),
  'no-webpack-loader-syntax': require('./rules/no-webpack-loader-syntax'),
  'order': require('./rules/order'),
  'newline-after-import': require('./rules/newline-after-import'),
  'prefer-default-export': require('./rules/prefer-default-export'),
  'no-default-export': require('./rules/no-default-export'),
  'no-named-export': require('./rules/no-named-export'),
  'no-dynamic-require': require('./rules/no-dynamic-require'),
  'unambiguous': require('./rules/unambiguous'),
  'no-unassigned-import': require('./rules/no-unassigned-import'),
  'no-useless-path-segments': require('./rules/no-useless-path-segments'),
  'dynamic-import-chunkname': require('./rules/dynamic-import-chunkname'),
  'no-import-module-exports': require('./rules/no-import-module-exports'),

  // export
  'exports-last': require('./rules/exports-last'),

  // metadata-based
  'no-deprecated': require('./rules/no-deprecated'),

  // deprecated aliases to rules
  'imports-first': require('./rules/imports-first') };


const configs = exports.configs = {
  'recommended': require('../config/recommended'),

  'errors': require('../config/errors'),
  'warnings': require('../config/warnings'),

  // shhhh... work in progress "secret" rules
  'stage-0': require('../config/stage-0'),

  // useful stuff for folks using various environments
  'react': require('../config/react'),
  'react-native': require('../config/react-native'),
  'electron': require('../config/electron'),
  'typescript': require('../config/typescript') };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9pbmRleC5qcyJdLCJuYW1lcyI6WyJydWxlcyIsInJlcXVpcmUiLCJjb25maWdzIl0sIm1hcHBpbmdzIjoiMkVBQU8sTUFBTUEsd0JBQVE7QUFDbkIsbUJBQWlCQyxRQUFRLHVCQUFSLENBREU7QUFFbkIsV0FBU0EsUUFBUSxlQUFSLENBRlU7QUFHbkIsYUFBV0EsUUFBUSxpQkFBUixDQUhRO0FBSW5CLGVBQWFBLFFBQVEsbUJBQVIsQ0FKTTtBQUtuQixrQkFBZ0JBLFFBQVEsc0JBQVIsQ0FMRztBQU1uQixZQUFVQSxRQUFRLGdCQUFSLENBTlM7QUFPbkIsd0JBQXNCQSxRQUFRLDRCQUFSLENBUEg7QUFRbkIsZ0JBQWNBLFFBQVEsb0JBQVIsQ0FSSztBQVNuQix5QkFBdUJBLFFBQVEsNkJBQVIsQ0FUSjtBQVVuQix5QkFBdUJBLFFBQVEsNkJBQVIsQ0FWSjtBQVduQixtQkFBaUJBLFFBQVEsdUJBQVIsQ0FYRTtBQVluQiwwQkFBd0JBLFFBQVEsOEJBQVIsQ0FaTDtBQWFuQixnQ0FBOEJBLFFBQVEsb0NBQVIsQ0FiWDs7QUFlbkIsb0JBQWtCQSxRQUFRLHdCQUFSLENBZkM7QUFnQm5CLGNBQVlBLFFBQVEsa0JBQVIsQ0FoQk87QUFpQm5CLHNCQUFvQkEsUUFBUSwwQkFBUixDQWpCRDtBQWtCbkIseUJBQXVCQSxRQUFRLDZCQUFSLENBbEJKO0FBbUJuQixnQ0FBOEJBLFFBQVEsb0NBQVIsQ0FuQlg7QUFvQm5CLGlDQUErQkEsUUFBUSxxQ0FBUixDQXBCWjtBQXFCbkIsdUJBQXFCQSxRQUFRLDJCQUFSLENBckJGOztBQXVCbkIsaUJBQWVBLFFBQVEscUJBQVIsQ0F2Qkk7QUF3Qm5CLFlBQVVBLFFBQVEsZ0JBQVIsQ0F4QlM7QUF5Qm5CLG1CQUFpQkEsUUFBUSx1QkFBUixDQXpCRTtBQTBCbkIsV0FBU0EsUUFBUSxlQUFSLENBMUJVO0FBMkJuQixzQkFBb0JBLFFBQVEsMEJBQVIsQ0EzQkQ7QUE0Qm5CLGdDQUE4QkEsUUFBUSxvQ0FBUixDQTVCWDtBQTZCbkIsc0JBQW9CQSxRQUFRLDBCQUFSLENBN0JEO0FBOEJuQix1QkFBcUJBLFFBQVEsMkJBQVIsQ0E5QkY7QUErQm5CLDhCQUE0QkEsUUFBUSxrQ0FBUixDQS9CVDtBQWdDbkIsV0FBU0EsUUFBUSxlQUFSLENBaENVO0FBaUNuQiwwQkFBd0JBLFFBQVEsOEJBQVIsQ0FqQ0w7QUFrQ25CLDJCQUF5QkEsUUFBUSwrQkFBUixDQWxDTjtBQW1DbkIsdUJBQXFCQSxRQUFRLDJCQUFSLENBbkNGO0FBb0NuQixxQkFBbUJBLFFBQVEseUJBQVIsQ0FwQ0E7QUFxQ25CLHdCQUFzQkEsUUFBUSw0QkFBUixDQXJDSDtBQXNDbkIsaUJBQWVBLFFBQVEscUJBQVIsQ0F0Q0k7QUF1Q25CLDBCQUF3QkEsUUFBUSw4QkFBUixDQXZDTDtBQXdDbkIsOEJBQTRCQSxRQUFRLGtDQUFSLENBeENUO0FBeUNuQiw4QkFBNEJBLFFBQVEsa0NBQVIsQ0F6Q1Q7QUEwQ25CLDhCQUE0QkEsUUFBUSxrQ0FBUixDQTFDVDs7QUE0Q25CO0FBQ0Esa0JBQWdCQSxRQUFRLHNCQUFSLENBN0NHOztBQStDbkI7QUFDQSxtQkFBaUJBLFFBQVEsdUJBQVIsQ0FoREU7O0FBa0RuQjtBQUNBLG1CQUFpQkEsUUFBUSx1QkFBUixDQW5ERSxFQUFkOzs7QUFzREEsTUFBTUMsNEJBQVU7QUFDckIsaUJBQWVELFFBQVEsdUJBQVIsQ0FETTs7QUFHckIsWUFBVUEsUUFBUSxrQkFBUixDQUhXO0FBSXJCLGNBQVlBLFFBQVEsb0JBQVIsQ0FKUzs7QUFNckI7QUFDQSxhQUFXQSxRQUFRLG1CQUFSLENBUFU7O0FBU3JCO0FBQ0EsV0FBU0EsUUFBUSxpQkFBUixDQVZZO0FBV3JCLGtCQUFnQkEsUUFBUSx3QkFBUixDQVhLO0FBWXJCLGNBQVlBLFFBQVEsb0JBQVIsQ0FaUztBQWFyQixnQkFBY0EsUUFBUSxzQkFBUixDQWJPLEVBQWhCIiwiZmlsZSI6ImluZGV4LmpzIiwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IGNvbnN0IHJ1bGVzID0ge1xuICAnbm8tdW5yZXNvbHZlZCc6IHJlcXVpcmUoJy4vcnVsZXMvbm8tdW5yZXNvbHZlZCcpLFxuICAnbmFtZWQnOiByZXF1aXJlKCcuL3J1bGVzL25hbWVkJyksXG4gICdkZWZhdWx0JzogcmVxdWlyZSgnLi9ydWxlcy9kZWZhdWx0JyksXG4gICduYW1lc3BhY2UnOiByZXF1aXJlKCcuL3J1bGVzL25hbWVzcGFjZScpLFxuICAnbm8tbmFtZXNwYWNlJzogcmVxdWlyZSgnLi9ydWxlcy9uby1uYW1lc3BhY2UnKSxcbiAgJ2V4cG9ydCc6IHJlcXVpcmUoJy4vcnVsZXMvZXhwb3J0JyksXG4gICduby1tdXRhYmxlLWV4cG9ydHMnOiByZXF1aXJlKCcuL3J1bGVzL25vLW11dGFibGUtZXhwb3J0cycpLFxuICAnZXh0ZW5zaW9ucyc6IHJlcXVpcmUoJy4vcnVsZXMvZXh0ZW5zaW9ucycpLFxuICAnbm8tcmVzdHJpY3RlZC1wYXRocyc6IHJlcXVpcmUoJy4vcnVsZXMvbm8tcmVzdHJpY3RlZC1wYXRocycpLFxuICAnbm8taW50ZXJuYWwtbW9kdWxlcyc6IHJlcXVpcmUoJy4vcnVsZXMvbm8taW50ZXJuYWwtbW9kdWxlcycpLFxuICAnZ3JvdXAtZXhwb3J0cyc6IHJlcXVpcmUoJy4vcnVsZXMvZ3JvdXAtZXhwb3J0cycpLFxuICAnbm8tcmVsYXRpdmUtcGFja2FnZXMnOiByZXF1aXJlKCcuL3J1bGVzL25vLXJlbGF0aXZlLXBhY2thZ2VzJyksXG4gICduby1yZWxhdGl2ZS1wYXJlbnQtaW1wb3J0cyc6IHJlcXVpcmUoJy4vcnVsZXMvbm8tcmVsYXRpdmUtcGFyZW50LWltcG9ydHMnKSxcblxuICAnbm8tc2VsZi1pbXBvcnQnOiByZXF1aXJlKCcuL3J1bGVzL25vLXNlbGYtaW1wb3J0JyksXG4gICduby1jeWNsZSc6IHJlcXVpcmUoJy4vcnVsZXMvbm8tY3ljbGUnKSxcbiAgJ25vLW5hbWVkLWRlZmF1bHQnOiByZXF1aXJlKCcuL3J1bGVzL25vLW5hbWVkLWRlZmF1bHQnKSxcbiAgJ25vLW5hbWVkLWFzLWRlZmF1bHQnOiByZXF1aXJlKCcuL3J1bGVzL25vLW5hbWVkLWFzLWRlZmF1bHQnKSxcbiAgJ25vLW5hbWVkLWFzLWRlZmF1bHQtbWVtYmVyJzogcmVxdWlyZSgnLi9ydWxlcy9uby1uYW1lZC1hcy1kZWZhdWx0LW1lbWJlcicpLFxuICAnbm8tYW5vbnltb3VzLWRlZmF1bHQtZXhwb3J0JzogcmVxdWlyZSgnLi9ydWxlcy9uby1hbm9ueW1vdXMtZGVmYXVsdC1leHBvcnQnKSxcbiAgJ25vLXVudXNlZC1tb2R1bGVzJzogcmVxdWlyZSgnLi9ydWxlcy9uby11bnVzZWQtbW9kdWxlcycpLFxuXG4gICduby1jb21tb25qcyc6IHJlcXVpcmUoJy4vcnVsZXMvbm8tY29tbW9uanMnKSxcbiAgJ25vLWFtZCc6IHJlcXVpcmUoJy4vcnVsZXMvbm8tYW1kJyksXG4gICduby1kdXBsaWNhdGVzJzogcmVxdWlyZSgnLi9ydWxlcy9uby1kdXBsaWNhdGVzJyksXG4gICdmaXJzdCc6IHJlcXVpcmUoJy4vcnVsZXMvZmlyc3QnKSxcbiAgJ21heC1kZXBlbmRlbmNpZXMnOiByZXF1aXJlKCcuL3J1bGVzL21heC1kZXBlbmRlbmNpZXMnKSxcbiAgJ25vLWV4dHJhbmVvdXMtZGVwZW5kZW5jaWVzJzogcmVxdWlyZSgnLi9ydWxlcy9uby1leHRyYW5lb3VzLWRlcGVuZGVuY2llcycpLFxuICAnbm8tYWJzb2x1dGUtcGF0aCc6IHJlcXVpcmUoJy4vcnVsZXMvbm8tYWJzb2x1dGUtcGF0aCcpLFxuICAnbm8tbm9kZWpzLW1vZHVsZXMnOiByZXF1aXJlKCcuL3J1bGVzL25vLW5vZGVqcy1tb2R1bGVzJyksXG4gICduby13ZWJwYWNrLWxvYWRlci1zeW50YXgnOiByZXF1aXJlKCcuL3J1bGVzL25vLXdlYnBhY2stbG9hZGVyLXN5bnRheCcpLFxuICAnb3JkZXInOiByZXF1aXJlKCcuL3J1bGVzL29yZGVyJyksXG4gICduZXdsaW5lLWFmdGVyLWltcG9ydCc6IHJlcXVpcmUoJy4vcnVsZXMvbmV3bGluZS1hZnRlci1pbXBvcnQnKSxcbiAgJ3ByZWZlci1kZWZhdWx0LWV4cG9ydCc6IHJlcXVpcmUoJy4vcnVsZXMvcHJlZmVyLWRlZmF1bHQtZXhwb3J0JyksXG4gICduby1kZWZhdWx0LWV4cG9ydCc6IHJlcXVpcmUoJy4vcnVsZXMvbm8tZGVmYXVsdC1leHBvcnQnKSxcbiAgJ25vLW5hbWVkLWV4cG9ydCc6IHJlcXVpcmUoJy4vcnVsZXMvbm8tbmFtZWQtZXhwb3J0JyksXG4gICduby1keW5hbWljLXJlcXVpcmUnOiByZXF1aXJlKCcuL3J1bGVzL25vLWR5bmFtaWMtcmVxdWlyZScpLFxuICAndW5hbWJpZ3VvdXMnOiByZXF1aXJlKCcuL3J1bGVzL3VuYW1iaWd1b3VzJyksXG4gICduby11bmFzc2lnbmVkLWltcG9ydCc6IHJlcXVpcmUoJy4vcnVsZXMvbm8tdW5hc3NpZ25lZC1pbXBvcnQnKSxcbiAgJ25vLXVzZWxlc3MtcGF0aC1zZWdtZW50cyc6IHJlcXVpcmUoJy4vcnVsZXMvbm8tdXNlbGVzcy1wYXRoLXNlZ21lbnRzJyksXG4gICdkeW5hbWljLWltcG9ydC1jaHVua25hbWUnOiByZXF1aXJlKCcuL3J1bGVzL2R5bmFtaWMtaW1wb3J0LWNodW5rbmFtZScpLFxuICAnbm8taW1wb3J0LW1vZHVsZS1leHBvcnRzJzogcmVxdWlyZSgnLi9ydWxlcy9uby1pbXBvcnQtbW9kdWxlLWV4cG9ydHMnKSxcblxuICAvLyBleHBvcnRcbiAgJ2V4cG9ydHMtbGFzdCc6IHJlcXVpcmUoJy4vcnVsZXMvZXhwb3J0cy1sYXN0JyksXG5cbiAgLy8gbWV0YWRhdGEtYmFzZWRcbiAgJ25vLWRlcHJlY2F0ZWQnOiByZXF1aXJlKCcuL3J1bGVzL25vLWRlcHJlY2F0ZWQnKSxcblxuICAvLyBkZXByZWNhdGVkIGFsaWFzZXMgdG8gcnVsZXNcbiAgJ2ltcG9ydHMtZmlyc3QnOiByZXF1aXJlKCcuL3J1bGVzL2ltcG9ydHMtZmlyc3QnKSxcbn07XG5cbmV4cG9ydCBjb25zdCBjb25maWdzID0ge1xuICAncmVjb21tZW5kZWQnOiByZXF1aXJlKCcuLi9jb25maWcvcmVjb21tZW5kZWQnKSxcblxuICAnZXJyb3JzJzogcmVxdWlyZSgnLi4vY29uZmlnL2Vycm9ycycpLFxuICAnd2FybmluZ3MnOiByZXF1aXJlKCcuLi9jb25maWcvd2FybmluZ3MnKSxcblxuICAvLyBzaGhoaC4uLiB3b3JrIGluIHByb2dyZXNzIFwic2VjcmV0XCIgcnVsZXNcbiAgJ3N0YWdlLTAnOiByZXF1aXJlKCcuLi9jb25maWcvc3RhZ2UtMCcpLFxuXG4gIC8vIHVzZWZ1bCBzdHVmZiBmb3IgZm9sa3MgdXNpbmcgdmFyaW91cyBlbnZpcm9ubWVudHNcbiAgJ3JlYWN0JzogcmVxdWlyZSgnLi4vY29uZmlnL3JlYWN0JyksXG4gICdyZWFjdC1uYXRpdmUnOiByZXF1aXJlKCcuLi9jb25maWcvcmVhY3QtbmF0aXZlJyksXG4gICdlbGVjdHJvbic6IHJlcXVpcmUoJy4uL2NvbmZpZy9lbGVjdHJvbicpLFxuICAndHlwZXNjcmlwdCc6IHJlcXVpcmUoJy4uL2NvbmZpZy90eXBlc2NyaXB0JyksXG59O1xuIl19