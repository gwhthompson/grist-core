#!/usr/bin/env python3
"""
Merge the comprehensive openapi.yaml schema with the official schema,
converting parameter names and removing /api prefix to match official conventions.
"""

import yaml
import re
from collections import OrderedDict

def represent_ordereddict(dumper, data):
    """Custom representer for OrderedDict to preserve order in YAML"""
    return dumper.represent_dict(data.items())

def setup_yaml():
    """Configure YAML to preserve order and formatting"""
    yaml.add_representer(OrderedDict, represent_ordereddict)

def convert_param_refs(obj):
    """Recursively convert parameter references from my schema to official naming"""
    param_map = {
        'OrgId': 'orgIdPathParam',
        'WorkspaceId': 'workspaceIdPathParam',
        'DocId': 'docIdPathParam',
        'TableId': 'tableIdPathParam',
        'AttachmentId': 'attachmentIdPathParam',
        'UserId': 'userIdPathParam',
    }

    if isinstance(obj, dict):
        new_obj = {}
        for key, value in obj.items():
            if key == '$ref' and isinstance(value, str):
                for old_name, new_name in param_map.items():
                    if f'parameters/{old_name}' in value:
                        value = value.replace(f'parameters/{old_name}', f'parameters/{new_name}')
            new_obj[key] = convert_param_refs(value)
        return new_obj
    elif isinstance(obj, list):
        return [convert_param_refs(item) for item in obj]
    else:
        return obj

def convert_param_names_in_path(path_obj):
    """Convert parameter names in path object (oid->orgId, wid->workspaceId, etc.)"""
    param_name_map = {
        'oid': 'orgId',
        'wid': 'workspaceId',
        'docId': 'docId',  # stays the same
        'tableId': 'tableId',  # stays the same
        'attId': 'attachmentId',
        'uid': 'userId',
        'said': 'serviceAccountId',
        'vsId': 'formId',
        'colId': 'colId',  # stays the same
        'webhookId': 'webhookId',  # stays the same
        'proposalId': 'proposalId',  # stays the same
    }

    if isinstance(path_obj, dict):
        new_obj = {}
        for key, value in path_obj.items():
            # Convert parameter names in 'parameters' list
            if key == 'parameters' and isinstance(value, list):
                new_params = []
                for param in value:
                    if isinstance(param, dict) and 'name' in param:
                        old_name = param['name']
                        if old_name in param_name_map:
                            param = param.copy()
                            param['name'] = param_name_map[old_name]
                    new_params.append(param)
                value = new_params

            new_obj[key] = convert_param_names_in_path(value)
        return new_obj
    elif isinstance(path_obj, list):
        return [convert_param_names_in_path(item) for item in path_obj]
    else:
        return path_obj

def normalize_path(path):
    """Convert path to official convention: remove /api prefix, update param names"""
    # Remove /api prefix
    path = path.replace('/api/', '/')
    path = path.replace('/api', '/')

    # Convert parameter names
    param_replacements = {
        '{oid}': '{orgId}',
        '{wid}': '{workspaceId}',
        '{attId}': '{attachmentId}',
        '{uid}': '{userId}',
        '{said}': '{serviceAccountId}',
        '{vsId}': '{formId}',
    }

    for old, new in param_replacements.items():
        path = path.replace(old, new)

    return path

def get_paths_from_schema(schema):
    """Extract all path keys from a schema"""
    if 'paths' in schema:
        return set(schema['paths'].keys())
    return set()

def main():
    setup_yaml()

    # Load official schema (already in openapi-merged.yaml)
    with open('/home/user/grist-core/openapi-merged.yaml', 'r') as f:
        official = yaml.safe_load(f)

    # Load my comprehensive schema
    with open('/home/user/grist-core/openapi.yaml', 'r') as f:
        comprehensive = yaml.safe_load(f)

    # Get existing paths from official
    official_paths = get_paths_from_schema(official)
    print(f"Official schema has {len(official_paths)} paths")

    # Find missing paths
    comprehensive_paths = set()
    missing_paths = {}

    for path, path_obj in comprehensive['paths'].items():
        normalized_path = normalize_path(path)
        comprehensive_paths.add(normalized_path)

        # Check if this path is missing from official
        if normalized_path not in official_paths:
            # Convert the path object
            converted_obj = convert_param_names_in_path(path_obj)
            converted_obj = convert_param_refs(converted_obj)
            missing_paths[normalized_path] = converted_obj

    print(f"Comprehensive schema has {len(comprehensive_paths)} normalized paths")
    print(f"Found {len(missing_paths)} paths to add")

    # List the missing paths by category
    categories = {
        'Admin': [p for p in missing_paths if '/admin/' in p or '/install/' in p or '/configs/' in p],
        'Profile': [p for p in missing_paths if '/profile/' in p],
        'Users': [p for p in missing_paths if '/users/' in p and '/disable' in p or '/enable' in p],
        'Sessions': [p for p in missing_paths if '/session/' in p],
        'Service Accounts': [p for p in missing_paths if '/service-accounts' in p],
        'Templates': [p for p in missing_paths if '/templates' in p],
        'Widgets': [p for p in missing_paths if '/widgets' in p],
        'Document Ops': [p for p in missing_paths if '/docs/' in p and any(x in p for x in ['/fork', '/pin', '/unpin', '/remove', '/unremove', '/apply', '/replace', '/flush', '/assign'])],
        'Snapshots': [p for p in missing_paths if '/snapshots' in p],
        'Compare': [p for p in missing_paths if '/compare' in p],
        'Proposals': [p for p in missing_paths if '/propose' in p or '/proposals' in p],
        'Forms': [p for p in missing_paths if '/forms/' in p],
        'Timing': [p for p in missing_paths if '/timing' in p],
        'AI': [p for p in missing_paths if '/assistant' in p],
        'Export': [p for p in missing_paths if '/download/tsv' in p or '/download/dsv' in p or '/send-to-drive' in p],
        'Workspace Ops': [p for p in missing_paths if '/workspaces/' in p and ('/remove' in p or '/unremove' in p)],
        'Org Ops': [p for p in missing_paths if '/orgs/' in p and (re.search(r'/orgs/[^/]+/[^/]+$', p) or '/usage' in p)],
        'Webhook Queue': [p for p in missing_paths if '/webhooks/queue/' in p],
        'Subscriptions': [p for p in missing_paths if '/_subscribe' in p or '/_unsubscribe' in p],
    }

    print("\n=== Missing paths by category ===")
    for category, paths in categories.items():
        if paths:
            print(f"\n{category} ({len(paths)} paths):")
            for p in sorted(paths):
                print(f"  {p}")

    # Add missing paths to official schema
    for path, path_obj in missing_paths.items():
        official['paths'][path] = path_obj

    # Add missing tags
    existing_tags = {tag['name'] for tag in official.get('tags', [])}
    new_tags = [
        {'name': 'admin', 'description': 'Installation administration endpoints'},
        {'name': 'profile', 'description': 'User profile management'},
        {'name': 'sessions', 'description': 'Session management'},
        {'name': 'service-accounts', 'description': 'Service account management for API access'},
        {'name': 'templates', 'description': 'Template documents'},
        {'name': 'snapshots', 'description': 'Document version snapshots'},
        {'name': 'proposals', 'description': 'Document change proposals'},
        {'name': 'forms', 'description': 'Grist forms'},
        {'name': 'timing', 'description': 'Document timing and performance'},
        {'name': 'ai', 'description': 'AI assistant features'},
    ]

    for tag in new_tags:
        if tag['name'] not in existing_tags:
            official.setdefault('tags', []).append(tag)

    # Write merged schema
    with open('/home/user/grist-core/openapi-merged.yaml', 'w') as f:
        yaml.dump(official, f, default_flow_style=False, sort_keys=False, width=120)

    print(f"\n=== Merge complete ===")
    print(f"Merged schema now has {len(official['paths'])} total paths")
    print(f"Added {len(missing_paths)} new paths")
    print(f"Output written to openapi-merged.yaml")

if __name__ == '__main__':
    main()
