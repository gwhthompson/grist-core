#!/usr/bin/env python3
"""
Fix issues in the merged schema.
"""

import yaml
import sys

def main():
    # Load merged schema
    with open('/home/user/grist-core/openapi-merged.yaml', 'r') as f:
        schema = yaml.safe_load(f)

    # Load comprehensive schema for missing components
    with open('/home/user/grist-core/openapi.yaml', 'r') as f:
        comprehensive = yaml.safe_load(f)

    print("Applying fixes...")

    # Fix 1: Server variables (gristhost -> subdomain)
    if 'servers' in schema and len(schema['servers']) > 0:
        schema['servers'][0]['url'] = 'https://{subdomain}.getgrist.com/api'
        schema['servers'][0]['description'] = 'Grist API server'
        print("✓ Fixed server variables")

    # Fix 2: Add missing responses to /docs/{docId}/states/remove
    if '/docs/{docId}/states/remove' in schema.get('paths', {}):
        endpoint = schema['paths']['/docs/{docId}/states/remove']
        if 'post' in endpoint:
            endpoint['post']['responses'] = {
                '200': {
                    'description': 'Success'
                }
            }
            print("✓ Added missing responses to /docs/{docId}/states/remove")

    # Fix 3: Remove SCIM endpoints (external file refs)
    scim_paths = [k for k in schema.get('paths', {}).keys() if k.startswith('/scim/')]
    for path in scim_paths:
        del schema['paths'][path]
    if scim_paths:
        print(f"✓ Removed {len(scim_paths)} SCIM endpoints (external refs)")

    # Fix 4: Remove SCIM tag
    if 'tags' in schema:
        schema['tags'] = [tag for tag in schema['tags'] if tag.get('name') != 'scim']
        print("✓ Removed SCIM tag")

    # Fix 5: Fix null in enum (make nullable instead)
    def fix_null_enums(obj):
        """Recursively fix null in enum values"""
        if isinstance(obj, dict):
            # Process enum first
            if 'enum' in obj and isinstance(obj['enum'], list) and None in obj['enum']:
                obj['enum'] = [v for v in obj['enum'] if v is not None]
                if 'nullable' not in obj:
                    obj['nullable'] = True
            # Then recurse
            for key, value in list(obj.items()):
                fix_null_enums(value)
        elif isinstance(obj, list):
            for item in obj:
                fix_null_enums(item)

    fix_null_enums(schema)
    print("✓ Fixed null in enum values")

    # Fix 6: Fix duplicate operationId
    if '/docs' in schema.get('paths', {}) and 'post' in schema['paths']['/docs']:
        schema['paths']['/docs']['post']['operationId'] = 'createOrImportDoc'
        print("✓ Fixed duplicate operationId")

    # Fix 7: Copy missing schemas from comprehensive
    missing_schemas = []
    def find_schema_refs(obj, refs_list):
        if isinstance(obj, dict):
            for key, value in obj.items():
                if key == '$ref' and isinstance(value, str) and value.startswith('#/components/schemas/'):
                    schema_name = value.replace('#/components/schemas/', '')
                    refs_list.append(schema_name)
                else:
                    find_schema_refs(value, refs_list)
        elif isinstance(obj, list):
            for item in obj:
                find_schema_refs(item, refs_list)

    refs = []
    find_schema_refs(schema.get('paths', {}), refs)

    for schema_name in set(refs):
        if schema_name not in schema.get('components', {}).get('schemas', {}):
            if schema_name in comprehensive.get('components', {}).get('schemas', {}):
                schema.setdefault('components', {}).setdefault('schemas', {})[schema_name] = \
                    comprehensive['components']['schemas'][schema_name]
                missing_schemas.append(schema_name)

    if missing_schemas:
        print(f"✓ Copied {len(missing_schemas)} missing schemas: {', '.join(sorted(missing_schemas))}")

    # Fix 8: Copy missing parameters
    missing_params = []
    def find_param_refs(obj, refs_list):
        if isinstance(obj, dict):
            for key, value in obj.items():
                if key == '$ref' and isinstance(value, str) and value.startswith('#/components/parameters/'):
                    param_name = value.replace('#/components/parameters/', '')
                    refs_list.append(param_name)
                else:
                    find_param_refs(value, refs_list)
        elif isinstance(obj, list):
            for item in obj:
                find_param_refs(item, refs_list)

    param_refs = []
    find_param_refs(schema.get('paths', {}), param_refs)

    for param_name in set(param_refs):
        if param_name not in schema.get('components', {}).get('parameters', {}):
            if param_name in comprehensive.get('components', {}).get('parameters', {}):
                schema.setdefault('components', {}).setdefault('parameters', {})[param_name] = \
                    comprehensive['components']['parameters'][param_name]
                missing_params.append(param_name)

    if missing_params:
        print(f"✓ Copied {len(missing_params)} missing parameters: {', '.join(sorted(missing_params))}")

    # Write back
    with open('/home/user/grist-core/openapi-merged.yaml', 'w') as f:
        yaml.dump(schema, f, default_flow_style=False, sort_keys=False, width=120, allow_unicode=True)

    print("\n✅ All fixes applied successfully!")
    return 0

if __name__ == '__main__':
    sys.exit(main())
