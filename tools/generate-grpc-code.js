import childProcess from 'child_process';
import fs from 'fs';
import path from 'path';

if (fs.existsSync('src/grpc/generated-code')) {
    fs.rmSync('src/grpc/generated-code', {
        recursive: true
    });
}

fs.mkdirSync('src/grpc/generated-code');

const protocolBuffersAndService = childProcess.execSync(
    'npx grpc_tools_node_protoc ' +
    '--proto_path=node_modules/terraria-launcher.protos ' +
    '--js_out=import_style=commonjs,binary:src/grpc/generated-code ' +
    '--grpc_out=grpc_js:src/grpc/generated-code ' +

    'node_modules/terraria-launcher.protos/services/authentication/authentication.proto ' +
    'node_modules/terraria-launcher.protos/services/authentication/authorization.proto ', {
    cwd: process.cwd(),
    encoding: 'utf8' // to return string instead of buffer.
});
console.info(protocolBuffersAndService);

function FindAllFiles(beginDirectoryPath) {
    const queue = [beginDirectoryPath];
    const results = [];

    while (queue.length > 0) {
        const currentDirectory = queue.shift();
        const currentDirectoryItems = fs.readdirSync(currentDirectory);
        for (const item of currentDirectoryItems) {
            const itemPath = path.join(currentDirectory, item);
            if (fs.lstatSync(itemPath).isDirectory()) {
                queue.push(itemPath);
            } else {
                results.push(itemPath);
            }
        }
    }

    return results;
}

const generatedFiles = FindAllFiles('./src/grpc/generated-code');

const replacements = [];
for (const generatedFile of generatedFiles) {
    replacements.push([
        generatedFile
            .split(path.sep).slice(3).join('/'),

        path.join(path.parse(generatedFile).dir, path.parse(generatedFile).name + '.cjs')
            .split(path.sep).slice(3).join('/')
    ]);
}

for (const generatedFile of generatedFiles) {
    let content = fs.readFileSync(generatedFile, {
        encoding: 'utf8'
    });
    for (const replacement of replacements) {
        const [original, alternative] = replacement;
        content = content.replaceAll(original, alternative);
    }

    fs.writeFileSync(generatedFile, content, {
        encoding: 'utf8'
    });
}

for (const generatedFile of generatedFiles) {
    fs.renameSync(
        generatedFile,
        path.join(path.parse(generatedFile).dir, path.parse(generatedFile).name + '.cjs')
    );
}
