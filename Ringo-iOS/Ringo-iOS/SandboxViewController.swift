//
//  SandboxViewController.swift
//  Ringo-iOS
//
//  Created by Gautam Mittal on 5/23/15.
//  Copyright (c) 2015 Gautam Mittal. All rights reserved.
//

import UIKit
//import Cocoa

class SandboxViewController: UIViewController {
    
let screenSize: CGRect = UIScreen.mainScreen().bounds
    
    @IBOutlet weak var codeTextIO: UITextView!
    
    @IBOutlet weak var outputIO: UITextView!
   
    @IBOutlet weak var lineNumbersView: UITextView!
    
    var tmpNum:Float = 0.0;
    
    var tmpArr:NSMutableArray = [];
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
//        recursiveCodeCheck();
//        codeTextIO.contentInset = UIEdgeInsetsMake(0.0, 20.0, 0.0, 20.0);
        
//        print(screenSize.height);

        var timer = NSTimer.scheduledTimerWithTimeInterval(0.05, target: self, selector: Selector("recursiveCodeCheck"), userInfo: nil, repeats: true)
       
        
    }
    
    
    // like an update
    func recursiveCodeCheck() {
        var font = UIFont.systemFontOfSize(15.0);

     
        
        var numberOfLines = codeTextIO.contentSize.height / font.lineHeight;
        
        if Float(numberOfLines) != tmpNum {
            
            if Float(numberOfLines) > tmpNum {
                tmpArr.addObject("TMP");
            } else {
                tmpArr.removeLastObject();
            }
            
            tmpNum = Float(numberOfLines);
        }
        
        
        print(tmpArr)
        
        
        
        print(numberOfLines);

        
        
        var lineNumContent = String();

        for var i = 0; i < tmpArr.count; i++ {
            if (i == 0) {
                lineNumContent += String(i+1);
            } else {
                lineNumContent += "   " + String(i+1);
            }
            
        }
    
        lineNumbersView.text = lineNumContent;
        
//        lineNumbersView.contentSize.height
//        print(lineNumbersView.contentOffset.y);
//        print(codeTextIO.contentOffset.y);
        
        print(numberOfLines);
//        print(intLineNumbers);
        
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
        
        
        
        let request = NSMutableURLRequest(URL: NSURL(string: "http://4e2a4c9c.ngrok.io/build")!)
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
    
    }
