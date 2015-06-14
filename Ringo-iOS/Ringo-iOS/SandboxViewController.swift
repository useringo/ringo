//
//  SandboxViewController.swift
//  Ringo-iOS
//
//  Created by Gautam Mittal on 5/23/15.
//  Copyright (c) 2015 Gautam Mittal. All rights reserved.
//

import UIKit
//import SpriteKit
//import Cocoa

class SandboxViewController: UIViewController {
    
let screenSize: CGRect = UIScreen.mainScreen().bounds
    
    @IBOutlet weak var codeTextIO: UITextView!
    
    @IBOutlet weak var outputIO: UITextView!
   
    @IBOutlet weak var lineNumbersView: UITextView!
    
    var tmpNum:Float = 0.0;
    
    var tmpArr:NSMutableArray = [];
    
    
    let defaults = NSUserDefaults.standardUserDefaults()


    
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        if (defaults.objectForKey("fileKEY") != nil) {
            var filename = defaults.objectForKey("fileKEY")
            
            var data = defaults.objectForKey("savedSandboxes") as! NSDictionary
            print(data.objectForKey(filename!))
            
            
            codeTextIO.text = data.objectForKey(filename!) as! String
           
        }
        
        
        var timer = NSTimer.scheduledTimerWithTimeInterval(0.01, target: self, selector: Selector("recursiveCodeCheck"), userInfo: nil, repeats: true)
        
        
        
        
        
    
        
    }
    

    
    
    // like an update
    func recursiveCodeCheck() {

    
        var rows = round( (codeTextIO.contentSize.height - codeTextIO.textContainerInset.top - codeTextIO.textContainerInset.bottom) / codeTextIO.font!.lineHeight );
        
        print(rows);
        
        var lineNumContent = String();

        for var i = 0; i < Int(rows); i++ {
            if (i == 0) {
                lineNumContent += String(i+1);
            } else {
                lineNumContent += "   " + String(i+1);
            }
            
        }
    
        lineNumbersView.text = lineNumContent;
     
        lineNumbersView.contentOffset.y = codeTextIO.contentOffset.y;

        
    }
    
    

    override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()

    }
    
    


    @IBAction func executeCode(sender: AnyObject) {
  
        
        print("Executing code...");
        
        resignFirstResponder();
        self.view.endEditing(true);
        
        
        outputIO.text = "Compiling...";
        
        var code = codeTextIO.text;
        
        
        
        let request = NSMutableURLRequest(URL: NSURL(string: "http://17172eab.ngrok.io/build-sandbox")!)
        request.HTTPMethod = "POST"
        let postString = "code=" + code;
        request.HTTPBody = postString.dataUsingEncoding(NSUTF8StringEncoding)
        let task = NSURLSession.sharedSession().dataTaskWithRequest(request) {
            data, response, error in
            
            if error != nil {
                print("error=\(error)");
                
                self.outputIO.text = "An error occurred. Please check your device's internet connection.";
                
                return
            }
            
            print("response = \(response)")
            
            let responseString = NSString(data: data!, encoding: NSUTF8StringEncoding)
            print(responseString);
            
            dispatch_async(dispatch_get_main_queue(), { () -> Void in
               self.outputIO.text = String(responseString!);
                
            
                
            })
            
        }
        
        task!.resume()
        

    }
    
    
    
    @IBAction func saveSandbox(sender: AnyObject) {
        print("Attempting to save Xcode sandbox.");
        
        let alertController = UIAlertController(title: "Name this Sandbox", message: "You can come back to this Sandbox later if you save it.", preferredStyle: .Alert)
        
        let confirmAction = UIAlertAction(title: "Save", style: .Default) { (_) in
            if let field = alertController.textFields![0] as? UITextField {
                // store your data
                
                print(field.text)
                
                
                
                if var data0 = self.defaults.dictionaryForKey("savedSandboxes") {
                    print(data0)
                    
                    // make sure the user actually typed something in
                    if (field.text == "") {
                    
                        print("I'M EMPTY");
                        
                      
                            
                        
                        
                    } else {
                        data0[field.text!] = self.codeTextIO.text;
                        
                        self.defaults.setObject(data0, forKey: "savedSandboxes");
                        self.defaults.synchronize()
                        
                        print(self.defaults.dictionaryForKey("savedSandboxes"));
                    }
                    
                    
                    
                    
                } else { // if the NSUSerDefault is empty
                    print("not set")
                    
                    var data0 = ["code": "Hello"];
                    data0 = [:]
                    
                    data0[field.text!] = self.codeTextIO.text;
                    
                    self.defaults.setObject(data0, forKey: "savedSandboxes");
                    self.defaults.synchronize()
                    
//                    print(self.defaults.dictionaryForKey("savedSandboxes"));
                    
                }
                
    
                
                
            } else {
                print("Nothing gets saved");
                
                // user did not fill field
            }
        }
        
//        let cancelAction = UIAlertAction(title: "Cancel", style: .Cancel) { (_) in }
        
        alertController.addTextFieldWithConfigurationHandler { (textField) in
            textField.placeholder = "MyAwesomeSandbox"
        }
        
        alertController.addAction(confirmAction)
//        alertController.addAction(cancelAction)
        
        self.presentViewController(alertController, animated: true, completion: nil)
        
        
        
        
//        defaults.setObject("Coding Explorer", forKey: "userNameKey")
        
    }
    
    
    
    
    
    
    
    
    
    
    
    
    
    }
