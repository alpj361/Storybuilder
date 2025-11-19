const fs = require('fs');
const path = require('path');

const projectPath = path.join(__dirname, '../ios/vibecode.xcodeproj/project.pbxproj');
let projectContent = fs.readFileSync(projectPath, 'utf8');

// Helper to generate a random 24-char hex UUID (similar to Xcode's)
function generateUUID() {
  return Array.from({ length: 24 }, () => Math.floor(Math.random() * 16).toString(16)).join('').toUpperCase();
}

// UUIDs for our new files
const swiftFileRefUUID = generateUUID();
const objcFileRefUUID = generateUUID();
const swiftBuildFileUUID = generateUUID();
const objcBuildFileUUID = generateUUID();

console.log('Generated UUIDs:', {
  swiftFileRefUUID,
  objcFileRefUUID,
  swiftBuildFileUUID,
  objcBuildFileUUID
});

// 1. Add PBXBuildFile entries
const buildFileSectionStart = '/* Begin PBXBuildFile section */';
const swiftBuildFileEntry = `\t\t${swiftBuildFileUUID} /* PDFShareManager.swift in Sources */ = {isa = PBXBuildFile; fileRef = ${swiftFileRefUUID} /* PDFShareManager.swift */; };`;
const objcBuildFileEntry = `\t\t${objcBuildFileUUID} /* PDFShareManager.m in Sources */ = {isa = PBXBuildFile; fileRef = ${objcFileRefUUID} /* PDFShareManager.m */; };`;

if (!projectContent.includes('PDFShareManager.swift in Sources')) {
  projectContent = projectContent.replace(
    buildFileSectionStart,
    `${buildFileSectionStart}\n${swiftBuildFileEntry}\n${objcBuildFileEntry}`
  );
  console.log('Added PBXBuildFile entries');
} else {
  console.log('PBXBuildFile entries already exist');
}

// 2. Add PBXFileReference entries
const fileRefSectionStart = '/* Begin PBXFileReference section */';
const swiftFileRefEntry = `\t\t${swiftFileRefUUID} /* PDFShareManager.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; name = PDFShareManager.swift; path = vibecode/PDFShareManager.swift; sourceTree = "<group>"; };`;
const objcFileRefEntry = `\t\t${objcFileRefUUID} /* PDFShareManager.m */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.c.objc; name = PDFShareManager.m; path = vibecode/PDFShareManager.m; sourceTree = "<group>"; };`;

if (!projectContent.includes('path = vibecode/PDFShareManager.swift')) {
  projectContent = projectContent.replace(
    fileRefSectionStart,
    `${fileRefSectionStart}\n${swiftFileRefEntry}\n${objcFileRefEntry}`
  );
  console.log('Added PBXFileReference entries');
} else {
  console.log('PBXFileReference entries already exist');
}

// 3. Add to PBXGroup (vibecode group)
// We look for the group that contains AppDelegate.swift
const appDelegateMatch = projectContent.match(/children = \(\s+([A-F0-9]+) \/\* AppDelegate.swift \*\//);
if (appDelegateMatch) {
  const appDelegateUUID = appDelegateMatch[1];
  const groupStart = `children = (\n\t\t\t\t${appDelegateUUID} /* AppDelegate.swift */,`;
  const newGroupEntries = `\t\t\t\t${swiftFileRefUUID} /* PDFShareManager.swift */,\n\t\t\t\t${objcFileRefUUID} /* PDFShareManager.m */,`;
  
  if (!projectContent.includes(`${swiftFileRefUUID} /* PDFShareManager.swift */`)) {
    projectContent = projectContent.replace(
      groupStart,
      `${groupStart}\n${newGroupEntries}`
    );
    console.log('Added to PBXGroup');
  } else {
    console.log('PBXGroup entries already exist');
  }
} else {
  console.error('Could not find AppDelegate.swift in PBXGroup');
}

// 4. Add to PBXSourcesBuildPhase
const sourcesBuildPhaseStart = '/* Begin PBXSourcesBuildPhase section */';
const sourcesStartIndex = projectContent.indexOf(sourcesBuildPhaseStart);

if (sourcesStartIndex !== -1) {
  // Find the "files = (" part after the start
  const filesStartIndex = projectContent.indexOf('files = (', sourcesStartIndex);
  
  if (filesStartIndex !== -1) {
    // Check if already added
    const sourcesSectionEndIndex = projectContent.indexOf('/* End PBXSourcesBuildPhase section */', sourcesStartIndex);
    const sourcesSection = projectContent.substring(sourcesStartIndex, sourcesSectionEndIndex);
    
    if (!sourcesSection.includes('PDFShareManager.swift in Sources')) {
      const insertionPoint = filesStartIndex + 'files = ('.length;
      const newSourcesEntries = `\n\t\t\t\t${swiftBuildFileUUID} /* PDFShareManager.swift in Sources */,\n\t\t\t\t${objcBuildFileUUID} /* PDFShareManager.m in Sources */,`;
      
      projectContent = projectContent.slice(0, insertionPoint) + newSourcesEntries + projectContent.slice(insertionPoint);
      console.log('Added to PBXSourcesBuildPhase');
    } else {
      console.log('PBXSourcesBuildPhase entries already exist');
    }
  } else {
    console.error('Could not find "files = (" in PBXSourcesBuildPhase');
  }
} else {
  console.error('Could not find PBXSourcesBuildPhase');
}

fs.writeFileSync(projectPath, projectContent);
console.log('Successfully updated project.pbxproj');