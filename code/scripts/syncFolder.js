// global Scripting.FileSystemObject
var fso = WScript.CreateObject("Scripting.FileSystemObject");

// global counters
var filesCopied = 0,
    filesNotCopied = 0,
    filesRemoved = 0,
    foldersRemoved = 0;

//------------------------------------------------------------------------------
function syncFolder(srcFolder, dstFolder) {
//WScript.Echo("syncFolder from " + srcFolder.Path + " to " + dstFolder.Path);
  var filesToRemove = {};
  var foldersToRemove = {};
  var filesToCopy = [];
  var foldersToCopy = [];

  // collect existing files and folders in dst
  for (var it = new Enumerator(dstFolder.Files); !it.atEnd(); it.moveNext()) {
    filesToRemove[it.item().Name] = it.item();
  }
  for (var it = new Enumerator(dstFolder.SubFolders); !it.atEnd(); it.moveNext()) {
    foldersToRemove[it.item().Name] = it.item();
  }

  // collect existing files in src
  for (var it = new Enumerator(srcFolder.Files); !it.atEnd(); it.moveNext()) {
    var srcFile = it.item();
    var name = srcFile.Name;
    var copyIt = true;
    if (filesToRemove.hasOwnProperty(name)) {
      // destination file exists
      copyIt = false;
      if (srcFile.DateLastModified > fso.GetFile(filesToRemove[name].Path).DateLastModified) {
        // src file is newer, copy it
        copyIt = true;
      }
      delete filesToRemove[name];
    }
    if (copyIt) {
      // add to copy list
      filesToCopy.push(srcFile);
    }
    else {
      ++filesNotCopied;
    }
  }

  // remove deleted files
  for(var i in filesToRemove) {
    if (filesToRemove.hasOwnProperty(i)) {
      WScript.Echo("Delete " + filesToRemove[i]);
      filesToRemove[i].Delete();
      ++filesRemoved;
    }
  }

  // copy files
  for(var i = 0; i < filesToCopy.length; i++) {
    WScript.Echo("Copy " + filesToCopy[i]);
    filesToCopy[i].Copy(dstFolder.Path + '\\');
    ++filesCopied;
  }

  // enumerate subfolders
  for (var it = new Enumerator(srcFolder.SubFolders); !it.atEnd(); it.moveNext()) {
    var name = it.item().Name;
    var dstName = dstFolder.Path + '\\' + name;
    if (foldersToRemove.hasOwnProperty(name)) {
      // destination folder exists
      delete foldersToRemove[name];
    }
    else if (!fso.FolderExists(dstName)) {
      fso.CreateFolder(dstName);
    }
    foldersToCopy.push({src: it.item(), dst: fso.GetFolder(dstName)});
  }

  // remove deleted folders
  for(var i in foldersToRemove) {
    if (foldersToRemove.hasOwnProperty(i)) {
      WScript.Echo("Delete " + foldersToRemove[i]);
      foldersToRemove[i].Delete();
      ++foldersRemoved;
    }
  }

  // copy folders
  for(var i = 0; i < foldersToCopy.length; i++) {
    syncFolder(foldersToCopy[i].src, foldersToCopy[i].dst);
  }

}

//syncFolder(fso.GetFolder('C:\\Users\\Arne\\Documents\\Visual Studio 2012\\Projects\\Ajvar\\deploy\\src\\include'), fso.GetFolder('C:\\Users\\Arne\\Documents\\Visual Studio 2012\\Projects\\Ajvar\\deploy\\dst\\include'));
WScript.Echo("DISABLED");
WScript.Quit(-1);
WScript.Echo('\n' + filesCopied + ' files copied, ' + filesNotCopied + ' up to date, ' + filesRemoved + ' files and ' + foldersRemoved + ' folders removed.');